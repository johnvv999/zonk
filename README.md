# Zonk

Six-dice Zonk for up to 8 players on their own phones, anywhere. Static site on
GitHub Pages, live game state and archive in Firebase Realtime Database.
Free tier throughout, no payment method required.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole game. The only file you need to edit. |
| `database.rules.json` | Security rules to paste into the Firebase console. |
| `local-passphone.html` | Earlier single-device version. No Firebase, no internet. Keep or delete. |
| `splash.webp` | The opening art, shown for three seconds on every launch. |
| `manifest.json`, `icon-*.png`, `apple-touch-icon.png` | Home screen install: name, icon and standalone launch. |
| `og.jpg` | Link preview, shown when the URL is texted or posted. |
| `colorcoded.webp` | The full-screen art for a colour coded roll. |
| `ptf.webp` | The full-screen art for a PTF - three zonks in a row. |
| `.github/workflows/deploy.yml` | Builds and publishes the site, stamping `VERSION` on the way out. |

---

## Setup

### 1. Create the Firebase project

Go to <https://console.firebase.google.com> and click **Create a project**.
Name it anything (`zonk` is fine). Turn Google Analytics **off** — you don't need
it and it adds consent prompts. You stay on the free Spark plan; no card required.

### 2. Create the Realtime Database

In the left sidebar: **Build → Realtime Database → Create Database**.

- Pick a location (`us-central1` is fine for nationwide play).
- When it asks for rules, choose **Start in test mode**. You'll replace these in step 4.

Make sure you're in *Realtime Database*, not *Firestore Database*. They're
different products and this app uses Realtime Database.

### 3. Register a web app and copy the config

Click the gear icon → **Project settings** → scroll to **Your apps** → click the
web icon `</>`. Give it a nickname, skip Firebase Hosting, click **Register app**.

You'll get a `firebaseConfig` block. Copy it.

Open `index.html`, find the block marked `FIREBASE CONFIG` near the top of the
`<script>` tag, and replace the placeholder values with yours. It looks like this:

```js
const firebaseConfig = {
  apiKey:            "AIza...",
  authDomain:        "zonk-1234.firebaseapp.com",
  databaseURL:       "https://zonk-1234-default-rtdb.firebaseio.com",
  projectId:         "zonk-1234",
  storageBucket:     "zonk-1234.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc"
};
```

If `databaseURL` is missing from what Firebase gave you, you skipped step 2 or
created a Firestore database instead. Go back and create the Realtime Database.

These keys are public by design — they identify your project, they don't
authorize anything. The security rules in the next step are what protect the data.

### 4. Lock down the rules

Realtime Database → **Rules** tab. Delete what's there, paste the contents of
`database.rules.json`, click **Publish**.

What these do:

- Rooms are readable and writable by anyone with the 4-character code. Fine for a
  private game; anyone who guesses a code could interfere with a game in progress.
- The archive is readable by anyone, and entries can be **created but never edited
  or deleted**. Nobody can rewrite history, including you — deletions have to go
  through the console.
- Field sizes are capped so nobody can dump junk into your database.

Test mode rules expire after 30 days and the whole thing stops working, so don't
skip this step.

### 5. Publish to GitHub Pages

Create a repo, push `index.html` to the root, then **Settings → Pages → Source
→ GitHub Actions**. Live at `https://<user>.github.io/<repo>/` within a minute
or two of each push to `main`.

`.github/workflows/deploy.yml` does the deploy. It copies the repo into a `_site`
directory, stamps `VERSION`, and publishes that — so the branch itself is never
rewritten. If the `VERSION` line ever goes missing the job fails rather than
shipping an unstamped build, because a stale `VERSION` silently strands every
client on an old copy (see *Versioning* below).

Firebase doesn't need to know about your domain for Realtime Database access, so
there's nothing else to configure.

### 6. Tell your players

Send them the URL. Each person:

1. Opens the link and types their own name.
2. **Add to Home Screen.** The home screen offers this itself: on Android an
   *Add Zonk to your home screen* button appears and opens Chrome's own install
   dialog; on iPhone a line points at Share → Add to Home Screen, since iOS has
   no install API to call. Both stay hidden once it's installed. It lands as a
   Zonk icon that opens without browser chrome. On iPhone this also matters for
   notifications — see the alerts section below.

   Either way there's a **Play without installing** button next to it. Taking it
   sets the offer aside for that visit only — a reload keeps it away, which
   matters because the page reloads itself onto each new version, but coming back
   later offers again. Nothing at all is offered once the app is installed.

   On iPhone it has to be **Safari**. Every iOS browser is the same WebKit
   underneath, so the game plays fine in any of them, but only a home screen app
   added from Safari runs standalone and can be notified — what the others add is
   a shortcut that opens back inside them. Open the link in one of those and the
   page says so.

   There's no link that does this — neither platform has an install URL, so the
   offer has to come from the page. Sending the URL is all you can do; the page
   takes it from there.
3. One person taps **Start a new room** and reads out the 4-character code.
   Everyone else types the code and taps **Join room**.
4. Everyone taps **Turn on turn alerts** in the lobby.
5. The host taps **Start game**.

---

## Turn alerts

Three things fire when it becomes your turn: vibration, a two-note chime, and a
system notification. Platform support is uneven:

| | Android Chrome | iPhone Safari |
|---|---|---|
| Vibration | Yes | Never — iOS has no vibration API for web |
| Chime | Yes | Yes, while the page is open |
| Notification | Yes | Only if added to the Home Screen |

So on iPhone, **Add to Home Screen is what makes notifications work**. Without it
an iPhone player only gets the chime, and only while the page is in front.

The app also requests a screen wake lock so phones don't sleep mid-game.

## If someone drops off

Cellular being what it is, a player will occasionally vanish mid-turn. Nothing
is ever skipped automatically — a slow player is left to play. But once a turn
has gone two minutes without a sign of life, everyone else sees a **Skip this
player** button, and one of them decides. Skipping banks nothing for that player
and moves on. Nobody is offered the chance to skip themselves.

The two minutes are counted between signs of life, not from the start of the
turn. Rolling and banking are the obvious ones, but picking which dice to keep
writes nothing, so a player deliberating would otherwise look identical to one
who has walked off. Their phone marks the turn while they choose — at most once
every twenty seconds, so it costs next to nothing — and the quiet is measured
from whichever came last.

Solo games are exempt, since nobody is waiting on you.

Starting a solo game steps away from the shared table, so anyone who sits down
while you're playing one is there on their own. When that happens you're asked
whether to abandon the solo game and join them — once per newcomer, so saying no
doesn't mean being asked again every time the table changes.

An hour of complete quiet clears an unfinished game, but that hour is counted
from the last thing that happened in it, not from when it started — a long game
that is still being played is never cleared out from under you.

A player who reloads or reconnects rejoins their game automatically — their
identity is stored on their device.

A phone that loses signal, force-quits or goes flat never fires its disconnect
handler, so its seat would otherwise sit in the lobby forever. Each seated phone
marks itself alive every ten minutes, and any phone with the app open clears
seats that have gone quiet for an hour. A phone never clears its own seat, so a
table nobody has open is left alone until somebody opens it — which is when a
stale lobby would be noticed anyway. The mark is separate from `joined`, since
turn order sorts on that.

A solo game is kept on the device too, so leaving the app and coming back drops
you where you left off rather than at the opening screen. It is discarded once
the game ends, or after the same one-hour limit that clears an abandoned table.
Solo games don't sound turn alerts — it's one player on one device, so there is
nobody to notify.

## The hall of fame

When a game ends, the winner types a victory line. That plus the final scores gets
written to `/archive` and is readable from the **Hall of fame** button on the home
screen. The archive survives everything; live rooms are deleted when the host taps
**Back to start**.

## Link previews

Texting the URL brings up a card with `og.jpg` on it. That comes from the Open
Graph tags in the `<head>` — iMessage, Google Messages, WhatsApp and Signal all
read the same ones.

Two things to know if you change it. `og:image` has to be an **absolute** URL;
a relative one is silently ignored and the preview comes up blank, which is the
usual reason these don't work. And the tags name the site's address directly, so
if the site ever moves, they have to move with it.

Previews are cached hard, by the messaging apps and by their servers. Once a
friend's phone has drawn a card for a URL it will keep drawing that one, so
changing `og.jpg` won't refresh what somebody has already seen. Sending
`?x=2` on the end of the link is enough to make it fetch again.

## Versioning

GitHub Pages caches HTML for ten minutes and phones hold it far longer, so the
page checks itself: it re-fetches its own source bypassing the cache, and if the
deployed `VERSION` differs from the one running, it reloads onto that version.

That only works if `VERSION` changes on every deploy, so the deploy workflow
stamps it — `<UTC timestamp>-<short sha>` — rather than leaving it to be
remembered. The value committed in `index.html` is a fallback for opening the
file straight from disk; what ships is always the stamp.

Two things worth knowing if a client ever looks stuck on an old build:

- A build whose script failed to parse cannot update itself, because the update
  check lives in that same script. Such a client needs one manual hard refresh
  and will then self-heal from there.
- Shipping two builds with the same `VERSION` leaves clients on the first one
  indefinitely. The workflow makes that impossible, which is why the stamp is
  not optional.

## Costs

Realtime Database on Spark gives 1 GB stored, 10 GB downloaded per month, and 100
simultaneous connections. A full game with 8 players moves roughly 5 MB, so you
have room for hundreds of games a month. Spark enforces hard cut-offs rather than
overage billing — if you somehow hit a limit the app stops working until reset, and
you never get a bill.

Archive entries are a few hundred bytes each. You'd need tens of thousands of games
to notice the storage.

## Rules implemented

Standard six-die chart: 1s are 100, 5s are 50, three of a kind is 100 × face
(1000 for three 1s), four of a kind doubles it, five of a kind quadruples it, six
of a kind is 3000, a 1–6 straight is 1500, three pairs is 1500.

Keep at least one scoring die per roll. Zonk wipes the turn. All six dice scoring
goes hot. Reaching the target triggers a final round.

Stopping has two gates, and both must be open. The points: 300 in the turn, or
500 for your first score of the game. And the dice: **four set aside**. A big
score doesn't buy you out of the second one — three 1s is 1000 and still only
three dice, so you roll on. What counts is everything kept in the current run of
six plus whatever is going down now; hot dice bring all six back, so the count
starts again with them.

Three pairs is strict — three distinct values with exactly two each. Some tables
count four-of-a-kind plus a pair; that's a change in `scoreSet()`.

## Where things live in the code

- `scoreSet(dice)` — best score for a set, or `null` if a die is dead weight.
- `anyScore(dice)` — zonk detection.
- `drawActions(g, …)` — the two gates on stopping: the 300/500 score and the four dice.
- `advance(gained)` — end of turn, final-round trigger, winner selection.
- `alertMyTurn()` — vibrate, chime, notify.
- `saveToHall(g)` — the one write to `/archive`.
- `COLORS` — 2 red, 2 white, 2 green. Cosmetic only.

Only the active player's phone writes game state; everyone else listens. That's
what keeps concurrent writes from stepping on each other.
