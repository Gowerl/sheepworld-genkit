# Dokumentation & Setup-Anleitung: Sheepworld RAG-Applikation

Diese Dokumentation führt dich Schritt für Schritt durch die Einrichtung, das lokale Testen und das Deployment der Sheepworld Grounded Search & Chat Applikation.

---

## 1. Projekt-Spezifikationen

*   **Google Cloud Projekt-ID:** `sheep-vertex-ai`
*   **Projektnummer:** `513333570389`
*   **Vertex AI Search Datastore-ID:** `datastorage-sheepworld-de_1787649919596`
*   **GitHub-Repository:** `https://github.com/Gowerl/sheepworld-genkit`
*   **Frontend-Tech-Stack:** Next.js (React 19, TypeScript, CSS Modules)
*   **Backend-Tech-Stack:** Firebase Cloud Functions (Node.js 22, TypeScript, ES-Module)
*   **Orchestrierung & KI:** Firebase Genkit mit Vertex AI Plugin & Gemini 1.5 Flash

---

## 2. Firebase App in der Google Console einrichten (WICHTIG)

Ja, du solltest die Firebase App **direkt in der Firebase Console einrichten**. Da dein Google Cloud-Projekt (`sheep-vertex-ai`) bereits existiert und der Datenspeicher dort liegt, ist es extrem wichtig, dass du **kein neues Projekt erstellst**, sondern das bestehende Cloud-Projekt mit Firebase verknüpfst.

### Schritt-für-Schritt-Anleitung:

1.  **Firebase Console öffnen:**
    Gehe auf [console.firebase.google.com](https://console.firebase.google.com/) und melde dich mit dem Google-Konto an, das auch Zugriff auf dein Google Cloud-Projekt hat.

2.  **Bestehendes Google Cloud-Projekt verknüpfen:**
    *   Klicke auf **"Projekt hinzufügen"** (oder "Projekt erstellen").
    *   Klicke in das Eingabefeld für den Projektnamen. Firebase zeigt dir eine Dropdown-Liste deiner bestehenden Google Cloud-Projekte an.
    *   Wähle das Projekt **`sheep-vertex-ai`** aus.
    *   Akzeptiere die Firebase-Bedingungen und klicke auf **"Weiter"**.

3.  **Google Analytics (optional):**
    *   Du kannst Google Analytics für das Projekt aktivieren oder deaktivieren (für Testzwecke reicht Deaktivieren, kann später aktiviert werden).
    *   Klicke auf **"Firebase hinzufügen"**. Firebase wird nun die Firebase-Ressourcen in deinem bestehenden GCP-Projekt initialisieren. Dieser Vorgang dauert ca. 1 Minute.

4.  **Auf den "Blaze" (Pay-As-You-Go) Tarif upgraden:**
    *   Für die Nutzung von **Firebase Cloud Functions** (wo unsere Genkit-Flows laufen) benötigt Firebase zwingend den **Blaze-Tarif**.
    *   Klicke unten links in der Firebase Console auf "Upgrade" (neben "Spark-Tarif").
    *   Wähle den **Blaze-Tarif** aus. Da es sich um ein Pay-As-You-Go-Modell handelt, fallen Kosten nur bei tatsächlicher Nutzung an (Firebase bietet großzügige kostenlose monatliche Kontingente). Zudem erfordert Vertex AI ohnehin ein aktives Rechnungskonto im Google Cloud Projekt.

5.  **Dienste aktivieren:**
    *   Gehe im linken Menü auf **Build > Functions** und klicke auf **"Erste Schritte"** (bzw. Get Started), um den Functions-Dienst für das Projekt formal zu registrieren.
    *   Gehe im linken Menü auf **Build > Hosting** und klicke auf **"Erste Schritte"**, um das Hosting zu aktivieren.

---

## 3. Lokale Einrichtung & Authentifizierung

Um lokal auf deinem PC zu entwickeln und die Funktionen zu testen, müssen sich deine lokalen Tools (Firebase CLI und Genkit) bei Google Cloud authentifizieren, um auf den Vertex AI Search Datastore zuzugreifen.

### Schritt 1: Firebase CLI anmelden
Melde dich auf deinem PC in der Firebase-Befehlszeile an:
```bash
firebase login
```
*Es öffnet sich ein Browserfenster, in dem du dich mit deinem Google-Konto anmeldest.*

### Schritt 2: Google Cloud SDK (gcloud) & Application Default Credentials (ADC)
Genkit greift im Hintergrund auf die Google Cloud APIs zu. Dafür werden die sogenannten "Application Default Credentials" (ADC) benötigt.

1.  Falls noch nicht installiert, lade die [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) herunter und installiere sie.
2.  Öffne PowerShell oder CMD und initialisiere das SDK:
    ```bash
    gcloud init
    ```
    *Wähle dein Google-Konto und das Google Cloud-Projekt `sheep-vertex-ai` aus.*
3.  Erstelle die ADC-Anmeldedaten auf deinem lokalen PC:
    ```bash
    gcloud auth application-default login
    ```
    *Dies öffnet erneut ein Browserfenster. Nach erfolgreicher Anmeldung speichert gcloud eine lokale Anmeldedatei auf deinem PC, die Genkit automatisch erkennt.*

---

## 4. Lokale Entwicklung & Testen

### Schritt 1: Lokale Umgebungsvariablen einrichten
Erstelle im Ordner `functions/` eine Datei namens `.env` (diese Datei ist in `.gitignore` eingetragen und wird nicht hochgeladen), um deine Datastore-ID lokal zu hinterlegen:

**Datei: `functions/.env`**
```env
VERTEX_AI_DATASTORE_ID="datastorage-sheepworld-de_1787649919596"
GCLOUD_PROJECT="sheep-vertex-ai"
```

### Schritt 2: Cloud-Functions lokal starten (Emulator)
Wechsle in das Verzeichnis `functions/` und starte den Compiler im Watch-Modus sowie die Firebase Emulatoren:

1.  **Terminal 1 (TypeScript-Compiler im Hintergrund laufen lassen):**
    ```bash
    cd functions
    pnpm run build:watch
    ```
2.  **Terminal 2 (Firebase Local Emulator Suite starten):**
    ```bash
    cd functions
    firebase emulators:start --only functions
    ```
    *Die Emulatoren stellen deine Funktionen unter einer lokalen URL (z. B. `http://127.0.0.1:5001/sheep-vertex-ai/us-central1/search`) bereit.*

### Schritt 3: Next.js Frontend lokal starten
Öffne ein weiteres Terminal im **Projekt-Root-Verzeichnis** (nicht in `functions/`) und starte den Next.js-Entwicklungsserver:

```bash
pnpm dev
```
Öffne nun [http://localhost:3000](http://localhost:3000) im Browser. Deine Next.js-App läuft und kommuniziert direkt mit deinen lokal emulierten Firebase-Funktionen!

---

## 5. Deployment in die Cloud (Live-Stellung)

Sobald der Datenspeicher indiziert ist und deine lokalen Tests erfolgreich waren, kannst du alles mit wenigen Befehlen in die Google Cloud/Firebase deployen.

### Schritt 1: Datastore-ID als Secret im Backend hinterlegen
Für maximale Sicherheit hinterlegen wir die Vertex AI Datastore-ID als verschlüsseltes Secret in Google Cloud Functions, anstatt sie im Code hartzucodieren:

```bash
firebase functions:secrets:set VERTEX_AI_DATASTORE_ID="datastorage-sheepworld-de_1787649919596"
```

### Schritt 2: Deployment ausführen
Führe im Hauptverzeichnis des Projekts den Deploy-Befehl aus:

```bash
firebase deploy
```

**Was passiert bei diesem Befehl im Hintergrund?**
1.  **Next.js-Build:** Firebase erkennt, dass sich im Hauptverzeichnis eine Next.js-App befindet, baut diese und bereitet das Hosting vor.
2.  **Cloud-Functions-Build:** Die TypeScript-Dateien im Ordner `functions/` werden kompiliert.
3.  **Deployment:** 
    *   Die Next.js-App wird auf **Firebase Hosting** hochgeladen.
    *   Die Genkit-Flows `search` und `chat` werden als serverlose **Cloud Functions** bereitgestellt.
4.  **Live-URL:** Am Ende des Prozesses gibt dir das Firebase CLI die öffentliche Hosting-URL deiner App aus (z. B. `https://sheep-vertex-ai.web.app` oder `https://sheep-vertex-ai.firebaseapp.com`).

---

## 6. Code-Architektur im Überblick

Hier ist eine kurze Übersicht, wo sich die wichtigsten Logiken im Projekt befinden:

*   **`functions/src/index.ts`:**
    *   Enthält die Kern-KI-Logik.
    *   Initialisiert Genkit mit dem `@genkit-ai/vertexai`-Plugin.
    *   Definiert `searchFlow` und `chatFlow` mit dem `vertexRetrieval`-Grounding auf deinen Datenspeicher.
    *   Exportiert die Trigger `search` und `chat` via `onCallGenkit`.
*   **`src/lib/firebase.ts`:**
    *   Initialisiert das Firebase Client SDK im Next.js-Frontend.
    *   Stellt das `functions`-Objekt bereit, das die Verbindung zu den Cloud-Funktionen in `us-central1` herstellt.
*   **`src/app/page.tsx`:**
    *   Das reaktive Client-Frontend.
    *   Verwaltet die Zustände für Suche und Chat (Suchbegriff, Ergebnisse, Chat-Verlauf, Ladezustand).
    *   Ruft die Cloud Functions über `httpsCallable` auf.
*   **`src/app/page.module.css`:**
    *   Das komplette, visuell ansprechende Styling (Farben, Animationen, Kartenlayouts).

---

## 7. Sicherheitsempfehlungen für den Produktivbetrieb

1.  **Firebase App Check:**
    Im Code der Cloud-Functions haben wir `enforceAppCheck: false` gesetzt, um das lokale Testen zu vereinfachen. Sobald die App live geht, solltest du im Firebase-Menü unter **App Check** deine Web-App registrieren und `enforceAppCheck: true` in `functions/src/index.ts` setzen. Dies verhindert, dass unbefugte Dritte deine Such- und Chat-APIs von externen Webseiten aus aufrufen und Kosten verursachen.
2.  **CORS & Ursprungsbeschränkung:**
    Standardmäßig sind Callable Functions nur über deine Firebase Hosting-Domain aufrufbar. Du kannst dies in der Firebase Console bei Bedarf noch weiter einschränken.
