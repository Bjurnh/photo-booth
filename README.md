# Photobooth App

Browser-based photobooth: camera capture (built-in or DJI via USB webcam mode),
custom template overlays, filters, print, and save-to-laptop.

## Setup for event day (iPad captures, laptop stores files + is the print source)

### 1. On the laptop — start the save server
```bash
npm install
npm run server
```
This prints the laptop's local address, e.g. `http://192.168.1.20:4000`.
Keep this terminal window running during the event — photos land in
`server/saved-photos/`.

### 2. On the laptop — start the app itself (for deploy or local testing)
```bash
npm run dev
```
For iPad use, **deploy this to Vercel/Netlify** (free, ~2 min) so the iPad
gets a proper HTTPS URL — camera access requires `localhost` or HTTPS, and
plain `http://192.168.x.x` from the iPad will likely be blocked.

### 3. On the iPad — open the deployed app, then configure the save server
- Tap the ⚙ gear icon on the Home screen
- Enter the laptop's address from step 1 (e.g. `http://192.168.1.20:4000`)
- Tap "Test" to confirm it connects, then "Save"
- Both devices must be on the **same WiFi network**

### 4. Run the booth
Guests use the iPad: pick template → pick filter → capture → on the Review
screen, tap **"Save to Laptop"** to send the file to the laptop's storage,
**"Print"** to send to the Canon Selphy (AirPrint), or **"Download"** to save
locally on the iPad.

## Printer (Canon Selphy)
No special integration needed — Selphy supports AirPrint (iPad) and standard
drivers (laptop/Mac/Windows), so it shows up in the normal print dialog.

## Camera (DJI)
Works on **both** the laptop and a USB-C iPad, as long as you connect it the
right way:

- **Connect via USB-C cable** (not the DJI Mimo app — Mimo uses a private
  Bluetooth/WiFi connection that browsers cannot access at all)
- Set the DJI to **Webcam Mode** on the camera itself
- **iPad requirements:** USB-C port (iPad Pro 2018+, iPad Air 4th gen+, iPad
  mini 6th gen+, or newer base iPad) **and iPadOS 17 or later** — check under
  Settings → General → About → Software Version. Older Lightning iPads can't
  do this at all.
- Once connected and in Webcam Mode, pick it from the camera dropdown
  (top-right of the Capture screen) instead of the built-in camera — same
  dropdown works identically on laptop or iPad
- If the DJI isn't connected, both devices just fall back to their own
  built-in camera automatically
- The app automatically captures at a higher resolution (1080p) and does
  **not** mirror the image when an external camera is selected (mirroring
  is only applied to the built-in front camera, since a DJI isn't a selfie
  lens)

## Custom templates
Transparent PNG files, ideally matching the capture's aspect ratio (~4:3),
with a transparent "window" where the photo shows through. Upload from the
Template picker screen — no coding needed per template.

## Reliability features (for running unattended at an event)
- **Auto-reset**: if no one taps/touches the screen for 45s mid-flow, it
  warns for the last 10s then resets to Home — so one guest walking away
  doesn't leave the booth stuck on their photo
- **Templates persist**: uploaded templates are saved in the browser
  (localStorage) so a refresh or the iPad restarting won't wipe them —
  no need to re-upload if something hiccups mid-event
- **Camera errors are recoverable**: a denied/lost camera permission shows
  a Retry button instead of a dead screen
- **Print popup blocked**: if the browser blocks the print window, you get
  a clear message instead of a silent failure
- **Save-to-laptop times out**: if the WiFi connection to the laptop drops,
  the request fails after 8s with a clear error instead of hanging forever
- **Crash guard**: if an unexpected error occurs anywhere in the app, you
  get a "Restart booth" screen instead of a blank white page

## Before going live
Run a real dry-run with the actual iPad, DJI, and Selphy printer — this
covers the app logic, but real hardware/network quirks (WiFi range, printer
driver setup, DJI cable behavior) should be tested once end-to-end before
the event, not for the first time in front of guests.

