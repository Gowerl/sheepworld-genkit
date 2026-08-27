# Technische Dokumentation: Sheepworld Portal (Chat-Proxy & Genkit SEO-Generator)

Diese Dokumentation beschreibt die vollständige Architektur, die Workflows, die Datenquellen sowie die fortschrittlichen Techniken der neu aufgebauten Sheepworld-Schnittstellen auf Firebase Cloud Functions und dem Next.js Frontend.

---

## 1. Projekt-Übersicht & Dual-Architektur

Das Sheepworld-Service-Portal verfügt über eine performante, getrennte **Dual-Architektur**, die zwei völlig unterschiedliche Zwecke optimal bedient, ohne sich gegenseitig zu beeinflussen:

1. **Der Live-Chat (`runSession` Cloud Function):**
   * **Zweck:** Dient als sicherer, serverseitiger Authentifizierungs-Proxy zwischen dem Web-Frontend und der **Google Vertex AI Customer Engagement Suite (CES)**.
   * **Verhalten:** Verwendet **kein Genkit**, sondern leitet Chat-Nachrichten direkt an deinen Google Agenten weiter. Dadurch bleibt der Chat unberührt, stabil und exakt auf dem Stand deiner Google Agenten-Konfiguration.
2. **Der SEO-Text-Generator (`generateSEOContent` Cloud Function):**
   * **Zweck:** Erstellt suchmaschinen- und GEO-optimierte Marketing- und Blogtexte für den Shop.
   * **Verhalten:** Nutze das modernisierte **Genkit v1.0 SDK**, um per Custom-RAG (Grounding via Vertex AI Search Datastore), intelligenter promptgesteuerter Verlinkung und Gemini 2.5 Flash einen strukturierten SEO-Text zu verfassen.

---

## 2. Technische Spezifikationen & IDs

* **GCP-Projekt-ID:** `sheep-vertex-ai`
* **GCP-Projektnummer:** `513333570389`
* **GCP-Region (Functions):** `europe-west4` (Eemshaven - für minimale Latenz in Europa)
* **Vertex AI Search Datastore ID:** `datastorage-sheepworld-de_1787649919596`
* **Vertex AI Agent App-ID (CES):** `4f81f7dc-1ac2-49e5-8316-4fc755c057f7` (Standort: `us`)
* **Deployment-ID:** `7ed542cb-8a37-4a4f-8bc3-95831144346c`
* **GitHub-Repository:** `https://github.com/Gowerl/sheepworld-genkit`

---

## 3. Detaillierte Funktionsabläufe & Datenflüsse

### A. Der Live-Chat-Proxy (`runSession`)
```
[User im Browser] ──(Next.js App) ──► [runSession (GCP Function)] ──► [Google CES API (us)]
                                                                               │
[User sieht Chat] ◄── [Injektion von og:images] ◄── [Rich Payload JSON] ◄──────┘
```

1. **Request:** Der User schickt im Chat eine Nachricht ab. Das Next.js Frontend ruft die HTTPS Callable Function `runSession` auf.
2. **Auth Token Exchange:** Da wir den Google Cloud API-Key/Service-Account niemals im Browser aussetzen dürfen, initialisiert die Cloud Function im sicheren Backend die `google-auth-library`. Sie erzeugt ein kurzlebiges Google OAuth Access Token für die Rolle `Vertex AI User`.
3. **Google CES Request:** Die Funktion sendet einen POST-Request an die Google CES REST-API (`https://ces.googleapis.com/v1beta/...`).
4. **Image Augmentation (`augmentPayloadWithRealImages`):** Die Google-Schnittstelle liefert strukturierte Rich Payloads (z. B. Produkt-Karusselle). Da die standardmäßigen Bild-Links oft veraltet sind, durchsucht unser Backend die Antwort, holt sich die URLs der sheepworld.de Produktseiten und extrahiert über einen schnellen, serverseitigen HTML-Parser (`extractOgImage`) das aktuelle `og:image` der Webseite. Dieses Bild wird live in das JSON-Payload injiziert, bevor es an den Browser geschickt wird!
5. **Defensives UI-Rendering:** Falls Produktbilder aufgrund von CORS/Serverfehlern fehlschlagen, verfügt das Next.js Frontend über ein CSS-Fallback, das automatisch ein schickes Schaf-Emoji (`🐑`) anzeigt.

---

### B. Der Genkit SEO-Generator (`generateSEOContent`)
```
[SEO-Formular links] ──► [generateSEOContent] ──► 1. Vertex AI Search (Grounding)
                                                  2. Gemini 2.5 Flash (Structured Genkit v1)
                                                                 │
[Detaillierter Text] ◄─── [Automatisch validiertes JSON] ◄───────┘
  (inkl. Deeplinks)
```

1. **Eingabe:** Der Redakteur gibt ein Thema (z. B. *Faultier Bettwäsche*), Kernaspekte, Zielgruppe, Keywords und optional die **aktuelle Produkt-URL** ein.
2. **Grounding (Custom RAG):** Die Funktion kontaktiert über die Discovery Engine API deinen Google Vertex AI Search Datastore. Sie durchsucht den echten Web-Index von `sheepworld.de` nach passenden Produkten und extrahiert die URLs, Titel und Text-Snippets von bis zu 4 Dokumenten.
3. **Prompt-Zusammenbau & Smarte Verlinkung:**
   * Die Suchergebnisse werden als Hintergrund-Daten (`contextText`) an den Prompt angehängt.
   * **Die Deeplink-Logik:** Die KI erhält die strikte Anweisung, dass sich der Nutzer bereits auf der eingegebenen "aktuellen Produkt-URL" befindet. Es wird ihr **untersagt, auf das beschriebene Hauptprodukt selbst zu verlinken** (Selbstverlinkung macht keinen Sinn).
   * **Smarte Produktempfehlung:** Stattdessen analysiert die KI die anderen Suchergebnisse (z. B. passende Tassen, Kissen oder Grußkarten derselben Serie) und bettet 1-2 dieser ergänzenden Deeplinks vollkommen natürlich mit sprechenden Anker-Texten (z. B. `[unserer passenden Faultier-Kollektion](URL)`) ein.
4. **Structured Generation (Genkit v1.0):** Gemini 2.5 Flash generiert den SEO-Text und zwingt die Ausgabe über ein Zod-Schema in eine exakte JSON-Struktur (Titel, Meta-Beschreibung, Fließtext im Markdown-Format).
5. **Ergebnis:** Das Frontend rendert den Text in Markdown (inklusive klickbarer, echter Produktlinks) und stellt ein Metadaten-Dashboard bereit.

---

## 4. Angewandte High-End-Techniken & "Warum?"

Im Zuge der Optimierung wurden fortschrittliche Software-Engineering-Methoden implementiert, um Leistung, Latenz und Stabilität drastisch zu verbessern:

### 1. Lazy Loading über ES Dynamic Imports (`await import`)
* **Problem:** Normalerweise werden Imports am Kopf der Datei (`import { genkit } from "genkit"`) beim Laden der Cloud Function sofort ausgeführt. Das Genkit-Framework ist jedoch sehr mächtig und schwergewichtig. Der Import und die Initialisierung am Dateianfang dauerten **über 5,4 Sekunden**. Bei jedem lokalen Deployment oder beim "Kaltstart" der Funktion führte dies zu einem Timeout der Firebase CLI (die ein hartes 10-Sekunden-Limit besitzt).
* **Technik:** Wir haben die schwerfälligen Bibliotheken (`genkit`, `@genkit-ai/google-genai`, `@genkit-ai/firebase`, `google-auth-library`) vollständig aus dem globalen Scope entfernt. Sie werden nun **lazily (verzögert)** erst beim tatsächlichen Aufruf der jeweiligen Funktion über dynamische ES-Module geladen:
  ```typescript
  let aiInstance: any = null;
  async function getGenkit() {
    if (!aiInstance) {
      const { genkit } = await import("genkit");
      const { vertexAI } = await import("@genkit-ai/google-genai");
      // ...
    }
    return aiInstance;
  }
  ```
* **Warum?** Die Startzeit der Datei beim Firebase-Parsing sank von **5,47s auf 1,93s** (fast 3x schneller!). Timeouts beim Deployment sind damit für immer ausgeschlossen und die Kaltstartlatenz für User wurde minimiert.

### 2. Umgebungsspezifische Telemetrie-Initialisierung
* **Problem:** Die Funktion `enableFirebaseTelemetry()` initialisiert OpenTelemetry für Google Cloud Trace. Wenn dies auf einem lokalen Windows-PC ausgeführt wird, versucht die Bibliothek im Hintergrund, den GCP-Metadatenserver (`169.254.169.254`) abzufragen, um Systemdaten zu sammeln. Diese Anfrage hängt lokal für 10 Sekunden fest und bricht dann ab, was das lokale Testen und Deployen blockierte.
* **Technik:** Wir haben die Telemetrie an eine umgebungsspezifische Weiche gekoppelt:
  ```typescript
  if (process.env.K_SERVICE || process.env.FUNCTIONS_EMULATOR) {
    enableFirebaseTelemetry();
  }
  ```
* **Warum?** Beim lokalen Parsen und Deployen (wo weder Emulator noch GCP-Service aktiv sind) wird die Telemetrie übersprungen. In der echten GCP-Cloud (`K_SERVICE` ist gesetzt) oder im lokalen Emulator (`FUNCTIONS_EMULATOR` ist gesetzt) wird sie jedoch vollautomatisch aktiviert. Absolut fehlerfrei und sicher!

### 3. Strukturierte Ausgabe über Genkit v1.0 `output.schema`
* **Problem:** In älteren Genkit-Entwürfen wurde das Zod-Schema fälschlicherweise in `config.responseSchema` übergeben. Unter Genkit v1.0 führte dies dazu, dass das rohe JavaScript-Zod-Objekt (inklusive interner Systemvariablen wie `_def`, `~standard`, `_cached`) direkt an die Vertex AI REST-API geschickt wurde, was die API mit einem `400 Bad Request` ablehnte.
* **Technik:** Wir nutzen das standardisierte Genkit v1.0 `output`-Konstrukt:
  ```typescript
  const response = await ai.generate({
    model: vertexAI.model("gemini-2.5-flash"),
    prompt: prompt,
    output: { schema: z.object({ ... }) }
  });
  const parsedOutput = response.output; // Direkt typsicher verwendbar!
  ```
* **Warum?** Genkit übersetzt das Schema nun fehlerfrei in ein hochkompatibles JSON-Schema für die Google-API. Zudem entfällt das unsichere, manuelle `JSON.parse(response.text)`, da Genkit die Antwort im Hintergrund validiert und direkt als voll-strukturiertes TypeScript-Objekt in `response.output` bereitstellt.

---

## 5. UI/UX-Optimierungen im Frontend

Da KI-Textgenerierungen im Schnitt 5 bis 10 Sekunden dauern, haben wir das Benutzererlebnis im Dashboard massiv verbessert:

* **Der Echtzeit-Spinner:** Sobald der Klick auf "SEO-Text generieren" erfolgt, wechselt das rechte Ausgabefeld sofort von "Bereit zum Schreiben" auf ein **dynamisch pulsierendes Ladefenster**.
* **Informative Statusanzeige:** Ein rotierender Lade-Spinner im sheepworld-CI-Design sowie ein verständlicher Statustext informieren den Nutzer genau darüber, dass im Hintergrund die Datenbank nach passenden Fakten durchsucht und der suchmaschinenoptimierte Text strukturiert wird. Das verhindert vorzeitiges Abbrechen oder Frustration beim Nutzer.

---

## 6. Lokale Entwicklung & Emulatoren

Um das Projekt lokal auf deinem Rechner laufen zu lassen und Änderungen in Echtzeit zu testen, folge diesem Setup:

### 1. Firebase Functions Emulator starten (Terminal 1)
Der Emulator baut deinen TypeScript-Code im `functions`-Verzeichnis und simuliert die Cloud-Umgebung lokal:
```bash
cd functions
pnpm run serve
```
*   **Wichtig:** Der Emulator läuft im Hintergrund und liest Änderungen am kompilierten Code automatisch ein.
*   **Port:** `5001` (für die API-Schnittstellen).

### 2. Next.js Development Server starten (Terminal 2)
Öffne ein zweites Terminal im Hauptverzeichnis des Projekts:
```bash
pnpm dev
```
*   **URL:** [http://localhost:3000](http://localhost:3000)
*   **Entwicklungs-Verhalten:** Da die Next.js-Anwendung lokal im Development-Modus läuft, erkennt sie den Firebase Emulator automatisch und leitet alle API-Anfragen an `127.0.0.1:5001` weiter. Du testest also komplett lokal, schützt aber dein Budget und deine Cloud-Ressourcen!

---

## 7. Deployment-Leitfaden (Wichtig!)

Bitte beachte die goldene Regel zur Bereitstellung deines Codes:

1. **Frontend-Änderungen (Next.js / UI):**
   * Diese sind an **Firebase App Hosting** gekoppelt.
   * **Ablauf:** Du machst einfach einen ganz normalen Git-Commit und pushst ihn in dein GitHub-Repository. Firebase erfasst den Push auf den `main`-Branch und deployt die Webseite automatisch:
     ```bash
     git add .
     git commit -m "style: Verschönerung des Dashboards"
     git push
     ```
2. **Backend-Änderungen (Cloud Functions / Prompts / APIs):**
   * Diese liegen im `/functions`-Ordner und werden **nicht** durch ein einfaches Git-Push aktualisiert!
   * **Ablauf:** Um geänderte Prompts, neue Datenspeicher-IDs oder API-Strukturen live zu schalten, musst du diesen Befehl im Terminal ausführen:
     ```bash
     firebase deploy --only functions
     ```
     *(Dies lädt ausschließlich deinen bereinigten, hoch-optimierten Backend-Code auf die europäischen Server in `europe-west4` hoch).*

---

Diese Architektur stellt sicher, dass deine Sheepworld-Plattform zukunftssicher aufgestellt ist, extrem schnell startet und sowohl für die Redakteure als auch für Suchmaschinen die allerbesten Ergebnisse liefert!
