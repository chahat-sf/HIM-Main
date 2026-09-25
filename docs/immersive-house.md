# Immersive house

Behavioral reference for a single-page house experience. It describes how the site is structured and how a visit works, so another agent can rebuild the interaction without the original campaign.

Lines marked **inferred** come from the content model and were not clicked through to the end.

English is the default locale. The same experience exists in `ar`, `de`, `en`, `es`, `fr`, `hk`, `it`, `ja`, `ko`, `pt`, `th`, `tr`, and `zh`. The page does not change URL as you move through it.

---

## What the experience is

A sound-on, non-scrolling page. The visitor enters a photographed house, picks up a notebook, and completes it by using objects in three rooms. Each completed object writes one line. Five lines finish the notebook and open a closing film plus an outbound link.

There is no cart. Two of the hotspots open a product viewer that links out. The other hotspots only write notebook lines.

The house is a set of still, art-directed photographs. Classical rooms have been painted by hand: a saturated door, paint stopping short of the molding, and one streak of that color left on the wall.

---

## Visit, in order

1. **Preloader.** Full-viewport flat color. Type only. No photography yet.
2. **Foyer, first time.** One hotspot: the notebook. A tutorial card tells you to pick it up.
3. **Notebook found.** The room blurs. A closed notebook floats up. You open it and read the first line.
4. **Back in the foyer.** That hotspot is now a checkmark. “Change room” appears.
5. **Outside.** A stone wall. Three shuttered windows, one per chapter. Arrows move between them. “Enter the room” dollies through the open window.
6. **Salon and workshop.** Each has three object hotspots. Two write notebook lines. One opens a product.
7. **Notebook, any time.** A counter in the corner opens the collected lines. Unfound lines are scrambled.
8. **Ending.** After line 5, a closing card, a film, an outbound “discover” link, and share.

You can leave a room before finishing it. Progress is kept. Rooms are not gated. Salon and workshop are both unlocked after the intro.

---

## Preloader

Background is a flat, deep navy. All type is white, widely tracked. The title is a loose two-column poster, centered. The last line is letterspaced across the width of the block. There is no background image.

Above the title, centered, a small speaker icon and a two-line prompt to turn sound on.

Under the title, one short sentence inviting you to explore.

Bottom center: a white rectangular button, dark door icon, label **Enter**.

Sound is already considered on. The only other control is a mute button (aria: “mute the sound”). An outdated-browser gate exists in copy and was not shown in a current desktop browser. It tells the visitor to try another browser or device.

Entering dismisses the type and reveals the foyer. There is no route change.

---

## Persistent interface

Once inside, chrome is the same in every room. It sits above the picture. Buttons are white, softly squared, with a thin shadow. Icons are black line drawings.

| Control | Place | Label | Behavior |
|---|---|---|---|
| Notes counter | Top left | Lock icon + `1/5` | Opens the notebook. Aria name is “open”. The fraction is collected lines out of 5. |
| Notebook | Top right | Pencil-and-book icon | Aria: “Open the notebook”. Same destination as the counter. Disabled while a reward card is up. |
| Change room | Bottom center | Door icon + “Change room” | Leaves the interior and returns to the outside wall. Hidden on the preloader and during the first tutorial. |
| Sound | Bottom right | Speaker icon | Toggles mute. Aria flips between “mute the sound” and “Enable the sound”. |
| Hotspot | On the object | White circle, icon, pulsing ring | Aria: “Open the interaction”. |

Tutorial and reward cards share one component: a cream rounded rectangle, a white circle with a line icon, two lines of copy, and a white pill button. A few words in the sentence are blue and bold. The card sits low-center and does not cover the whole screen.

Hotspot states:

- **Idle.** White disc, icon, animated outer ring.
- **Loading.** Ring becomes a progress indicator while that interaction’s bundle loads.
- **Done.** Smaller disc with a check. It can still be opened.

Icons seen on hotspots: notebook, pencil (this object writes a line), photograph (the color interaction).

---

## Outside: choosing a room

“Change room” pulls the camera back through the window until you are outside, looking at a pale stone-block wall in daylight. Soft shadows fall across the blocks. Each chapter is one window with open shutters. The interior is visible through the opening, small, like a view through a real window. White type sits centered over the wall:

```
CHAPTER I
THE FOYER
```

A white **Enter the room** button sits under the window (door icon). Round white arrow buttons sit on the left and right edges. The arrow at the end of the list is disabled. Moving to the next chapter slides the wall sideways. It is one continuous facade, not three pages.

| Chapter | Room | Shutters | What you see through the window |
|---|---|---|---|
| I | The Foyer | Blue | Painted door, console, lamp, chair |
| II | The Salon | Green | Painted door, lamp, table, papers on the floor |
| III | The Workshop | Red | Round table, sewing machine, a bag, painted door |

Shutter color does not match the door color inside that room.

“Enter the room” dollies the camera through that window into the interior. Chapter I can be re-entered after the notebook is done. Its only hotspot stays checked.

---

## How progress works

State after the intro:

```
currentRoomID: "foyer" | "salon" | "workshop" | "outside"
introDone: boolean
hotspotVisible: boolean
manifestoOpen: boolean
currentInteraction: null | interaction id
interactionLocked: boolean

rooms:
  foyer:    status completed | actions.notebook = done
  salon:    status unlocked  | actions.viewmaster, phone, bag = todo | done
  workshop: status unlocked  | actions.texture, colors, bag = todo | done
```

Five notebook lines. Only these actions write a line:

| # | Earned by | Role of the line |
|---|---|---|
| 1 | Foyer notebook, during the intro | First line. Unlocks the rest of the house. |
| 2 | Salon, image viewer (**inferred**) | Also carries an outbound shop link in the notebook. |
| 3 | Salon, telephone (**inferred**) | Also carries an outbound shop link in the notebook. |
| 4 | Workshop, texture desk (**inferred**) | Also carries a longer craft note in the notebook. |
| 5 | Workshop, colors (**inferred**) | Also carries a color note in the notebook. |

The salon **bag** and workshop **bag** hotspots open the product viewer. They do not write a line. After line 1 the tutorial says to uncover the other **4 hidden notes**.

Lines have a fixed order in the notebook. Finding them out of order still fills that line’s slot. The counter is how many are filled, not how many rooms you have visited.

After each new line, a reward card appears before you return to the room. The number in the card is how many lines are still unwritten:

| Lines still unwritten | Card |
|---|---|
| 4, and this was the intro | You wrote the first line. Then a second card: explore the rooms to uncover the other 4 hidden notes. Button **Next** on the first card. The second card dismisses back to the room. |
| 4 | You wrote another line. 4 left. |
| 3 | You wrote another line. 3 left. |
| 2 | The notebook is almost complete. Only two lines left. |
| 1 | Just one line left. |
| 0 | You’ve completed the notebook. Discover what comes next. |

Shared buttons on the later cards: **Continue**, **Open the notebook**, and **Go to the _room_** (the room name is substituted).

---

## The notebook

Opened from the counter or the top-right icon. It is a full-screen paper surface, not a small modal over a sharp room. The paper is warm off-white. Faint scribbles sit in the background. A loose ink circle is drawn on the left. A white sticker, top left, shows a lock and **1/5 Notes**.

Collected lines are handwriting, numbered, sometimes underlined, with a small arrow pointing at a taped photograph. Uncollected lines are the same sentence run through a letter scramble. Spaces, commas, and apostrophes stay put, so the shape of the sentence is visible and the words are not.

At 1 of 5, slot 1 is readable handwriting and slots 2–5 are scrambled. Each slot can also hold extra material once found: a photo, a shop link, or a longer note. Empty descriptions stay empty.

Header when the notebook is the index, rather than the “you just found it” moment:

- Title: **Notebook**
- Description: explore the house and interact with the objects to complete the notebook.
- Counter label: **Notes**

The first time you find it, before the handwritten page, there is a beat on the blurred foyer:

- Small eyebrow: **YOU FOUND**
- Title: **THE NOTEBOOK**
- A cloth-bound notebook, tilted, floating in the center. A wordmark is debossed on the cover.
- Card: pencil icon, “You wrote a new line in the notebook”, button **Read it**.

**Read it** lands on the paper page, line 1, and the taped photo.

---

## Rooms

Interiors are locked photographs, not a walkable space. There is no free camera and no WASD movement. Objects that can be used wear a hotspot. Leaving is only “Change room”. Painted doors inside a room are scenery. You do not click them to travel.

Shared interior look: white upper wall, taupe paneling to chair-rail height, pale carpet, soft daylight, no people. Every room has one paneled door in a flat color, paint short of the molding, and one horizontal smear of that color across the chair rail.

### Chapter I — The Foyer

Seen after Enter, and again after the first line.

- Left: a wooden console, a ceramic lamp with a colored shade, two stacks of books. The notebook hotspot sits on the books.
- Center: a tall paneled door, painted, wood showing at the edges.
- A paint smear runs from the lamp, across the wall, and into the door.
- Right of that door: an upholstered chair.
- Far right: a second painted door, a different color. Scenery only.

Only action: `notebook`. After it is done, the hotspot is a check and the tutorial card is gone.

### Chapter II — The Salon

**Inferred** from the window view plus the action list. Not walked in this pass.

Actions: `viewmaster`, `phone`, `bag`.

Through the shutters: a painted door with light trim, a lamp on a small table, a chair, and papers or fabric on the carpet. Same paneling, with a paint smear in the door’s color.

### Chapter III — The Workshop

Entered and seen.

- Left: a floor lamp.
- A carved chair. A handbag on the seat. Hotspot `colors` (photograph icon) sits on that bag.
- Center: an oval dark-wood table. On it, a sewing machine, a pile of quilted material, a cup, loose paper, and pens. Hotspot `texture` (pencil icon) sits on the sewing machine.
- Right side of the table: another bag stacked on books. Hotspot `bag` (pencil icon) sits on that bag.
- Behind the table: a painted door and a matching smear on the chair rail.

---

## Interactions

Each hotspot loads its own screen over the room. The notebook button locks while the interaction or its reward is open. Voiceover plays if sound is on, with a subtitle file per line. Every writing interaction ends in the shared “you wrote a new line” card, then returns you to the room with that hotspot checked.

### Foyer — notebook

Observed.

1. Card: “Pick up the notebook and get started.”
2. Click the notebook hotspot.
3. “You found / The notebook” with the floating book.
4. **Read it** opens the paper page on line 1 and its photo.
5. Card: you wrote the first line. Button **Next**.
6. Card: explore the rooms to uncover the other 4 hidden notes.
7. Return to the foyer. Hotspot checked.

A short voiceover plays across this beat, several lines, and the last spoken line is the sentence that gets written down.

### Salon — image viewer

**Inferred.** Desktop copy: “Click to discover more.” Mobile: “Tap to discover more.” A reel of six stills. While it turns, two short labels alternate.

Voiceover is several short lines. The last line is the sentence written into notebook slot 2. That slot’s extra is a shop link, so this interaction is tied to one of the two products.

Assets: viewer body (desktop and mobile), side caps, noise and texture overlays, backgrounds, an intro still.

### Salon — telephone

**Inferred.** Tutorial: “Dial the number on the phone and hear the message.” The correct number is printed on a paper in the scene. The digits were not captured.

Wrong number, in order: “Hello?”, “Hello?”, “Oops, you've dialed the wrong number.”

Right number: a short greeting, then a run of polaroids (frames, masks, and a still for desktop and mobile). Each polaroid has one or two spoken lines. The last line is the sentence written into notebook slot 3. That slot’s extra is the other shop link.

Assets: phone base, cord, shadow, button shadows, background, intro still, paper, faded number.

### Salon — product

**Inferred.** Not a notebook line. Action id `bag`.

Opens a product view: name, one paragraph, a button whose label is “Shop {name}”, and a carousel of colorways. Closing returns to the room. The hotspot does not check off as a note, but the action can still be marked done.

Aria: “Open the product view”, “Close the product view”.

### Workshop — texture

Loading was observed on the sewing-machine hotspot. The screen itself was not. Tutorial, desktop and mobile: “Touch the texture, let the craft unfold.”

Five short films of the work surface. Each has a poster and a still fallback, and is provided as both a modern and a compatibility video file.

Voiceover is several lines about how the material is built. The last line is the sentence written into notebook slot 4. That slot also stores a longer note explaining the construction.

Aria: “Play Video”, “Close Video”.

### Workshop — colors

**Inferred.** Hotspot is the bag on the chair (photograph icon). Desktop: “Click the bag, unveil its colors.” Mobile: “Tap the bag, unveil its colors.”

One spoken line. A polaroid prints that same sentence, broken over a few lines. That sentence is notebook slot 5. The slot also stores a note naming the colorways. The unveil is those colors, not a separate shop page.

Assets: an intro still.

### Workshop — product

**Inferred.** Hotspot is the bag on the books. Same viewer as the salon product: name, one paragraph, “Shop {name}”, color carousel, then back to the room. No notebook line.

---

## Ending

Shown when the notebook is complete, and present in the page as its own view.

- Title, short.
- One paragraph that ties the rooms together.
- **Discover** — leaves the experience. Destination is an external collection or product URL, chosen per market.
- **Share** — copies the page URL. Confirmation: “Link copied.” Share title and text reuse the page title and description.
- A closing film, provided as both a compatibility file and a modern file.
- Aria: “Close End Page”, “Play Video”, “Close Video”.

The end view has its own background, a poster still, and a few decorative images.

---

## Art direction

- **Preloader:** flat color, white grotesk, lots of air, no images. The title is a poster, not a hero photograph.
- **House:** real photography, quiet, slightly sun-faded. Furniture is ordinary: console, oval table, chairs, a sewing machine. Products are objects in the room, not floating on white.
- **The paint:** one saturated color per door, applied imperfectly, plus a single brush streak at chair-rail height. Exterior shutters are a second set of colors and do not match the door they frame.
- **UI:** white and cream on top of the photograph. No black bars, no menu, no logo in the room chrome. The only wordmark is debossed on the notebook and set in the preloader.
- **Notebook:** paper, tape, biro, polaroid. It should feel found, not like a product page.
- **Type:** a grotesk for UI and chapter titles, a script for handwritten lines, a mono available for the scramble or the phone.
- **Motion:** the preloader gives way to the room; the camera dollies through the window; hotspots pulse; the notebook and reward cards sit over a blurred room. The loading ring answers the click before the module arrives.

---

## Sound

The preloader asks for sound before you enter. Ambience follows where you are:

- Outdoor loop on the stone wall
- Indoor loop inside rooms
- One SFX sprite for UI
- Voiceover per interaction, with a subtitle file per cue: intro, image viewer, phone success, phone failure, phone polaroids, texture films, colors

If sound is off, subtitles and the on-screen cards still carry the lines. Mute persists via the corner button.

---

## Build notes

Structure only. Not a brief to copy the original stack.

- One app, one WebGL canvas. Chapter titles, “Enter the room”, and hotspots are DOM nodes positioned over the canvas, not painted into the picture.
- Each room is a large staged image, with a mobile crop, plus shared plates for doors, tables, and windows. The move from outside to inside is a camera dolly through that picture, not a walkable mesh.
- Each interaction is loaded the first time its hotspot is opened: notebook, phone, image viewer, product, colors, texture.
- Copy is keyed by locale. Groups: global UI, room names, tutorial, each interaction, notebook, ending, and aria labels.
- Outbound shop and “discover” URLs are per market, not one hardcoded link.
- Progress (which actions are done, whether the intro is finished, whether the notebook is open) lives in one client store. Room id is `foyer`, `salon`, `workshop`, or `outside`.

---

## What to rebuild

1. Flat poster preloader, sound prompt, **Enter**.
2. Foyer photograph, one notebook hotspot, tutorial card, floating book, handwritten line 1, reward, checkmark.
3. Outside wall with three labeled windows and a dolly-in.
4. Salon and workshop photographs, three hotspots each.
5. Five writing interactions: intro notebook, image reel, phone and polaroids, texture films, color unveil. Two product viewers that link out and do not write a line.
6. Notebook overlay: 5 slots, handwriting when found, scramble when not, a shop link on two of the lines, a longer note on two others.
7. Counter `n/5`, **Change room**, mute, and the ending card with film, discover, and share.

Do not add free walking, a room menu inside the interior, or a checkout. Navigation is the window, the hotspot, and the notebook.
