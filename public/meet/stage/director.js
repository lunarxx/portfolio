/* which camera and layout. every cut has a reason, never a timer on its own (his note, 2026-09-28: "be very smart with
   camera switches ... random switch is annoying"):
   - an act that shows something (a drink, the phone) or a big line: A, him to the camera, from its first word
   - the cat running off with his mouse: T, the camera that follows them round the room, for the whole chase
   - the cat walking over his keyboard: B, the whole desk, for all of it (her close-up only sees her spot)
   - the cat: K when she stretches while he is quiet (not more than once in 40 s), for as long as he pets her, when he
     talks about her while she does something (never for just waking up: his note "cat wasnt doing anything"),
     or when chat asks about her
   - coding: C over his shoulder; after a long run of typing with nothing said, B on his hands until he talks. playing
     his game: C (the game itself is up big)
   - chatting: A; a long silence gets one quiet shot (B) until he talks again
   a shot lasts at least minShot seconds and a cut lands between phrases, except a big line or an act, which cut in
   (but never into a shot under 1.5 s old: no flash cuts).
   update(t, ctx) -> the camera; .why is the reason for the current shot */
const WORK = new Set(['build', 'play', 'plan', 'showcase']);   // he's making or showing something: C over his shoulder sees his monitor
const ACT_CAM = { chug: 'A', sip: 'A', show_phone: 'A', pet_cat: 'K', stretch: 'B', dance: 'A', spin: 'A', wave: 'W', pushups: 'P', squats: 'P', jumping_jacks: 'T', room_dance: 'T' };

export function createDirector({ rand = Math.random, minShot = 4, catEvery = 40, handsAfter = 20, quietAfter = 7 } = {}) {
  let cam = null, since = -Infinity, why = '';
  let away = null, prevCat = null, lastCatShot = -Infinity, seenChatCat = 0, typingSince = null, hands = null, quietSince = null;

  function want(t, c) {
    /* what has been going on, every frame, whatever wins below (a big line returning early once left a silence stale) */
    if (c.speaking) quietSince = null; else if (quietSince === null) quietSince = t;
    if (c.typing && !c.speaking && !c.big) { if (typingSince === null) typingSince = t; } else typingSince = null;
    /* the cat ran off with his mouse and he's up chasing her: the tracking shot, whatever else goes on (A would show his empty chair) */
    if (c.catMode === 'chase') { prevCat = 'chase'; away = null; return { cam: 'T', why: 'he chases the cat round the room', urgent: true }; }
    if (c.act) return { cam: ACT_CAM[c.act] || 'A', why: `the act: ${c.act}`, urgent: true };
    if (c.big) return { cam: 'A', why: 'a big line, to the camera', urgent: true };
    const cat = c.catMode || 'doze';
    /* into the box: C (from behind him the box is in plain view), while she goes and gets in; then the usual shots (never her empty spot) */
    if (cat === 'box') {
      if (prevCat !== 'box') away = { cam: 'C', why: 'the cat gets in the box', until: t + 10 };   // B has it behind his monitor
      prevCat = cat;
      if (away && t < away.until) return away;
      away = null;
    }
    /* up on his head: A sees her jump and settle; while she's up there her spot on the desk is empty, so never K */
    if (cat === 'perch') {
      if (prevCat !== 'perch') away = { cam: 'A', why: 'the cat jumps up on his head', until: t + 8 };
      prevCat = cat;
      if (away && t < away.until) return away;
      away = null;
      if (c.speaking && c.catSaid) return { cam: 'A', why: 'he talks about the cat on his head' };
    }
    /* she pushes his mug off the desk: C, where the mug and the desk's edge are in plain view; him getting it off the floor: P (the desk hides the floor from the front) */
    if (cat === 'mug') { prevCat = cat; away = null; return { cam: 'C', why: 'the cat pushes his mug off the desk' }; }   // B has it behind his monitor
    if (cat === 'mugfetch') { prevCat = cat; away = null; return { cam: 'P', why: 'he picks his mug up off the floor' }; }
    /* asleep on his keyboard, and him lifting her off: B, his hands and the keys */
    if (cat === 'nap') { prevCat = cat; away = null; return { cam: 'B', why: 'the cat naps on his keyboard' }; }
    if (cat === 'walk') { prevCat = cat; away = null; return { cam: 'B', why: 'the cat walks over his keyboard' }; }   // B sees the whole desk; K only sees her spot
    if (prevCat !== null && cat !== prevCat) {
      if (cat === 'pet') away = { cam: 'K', why: 'he pets the cat', until: Infinity };
      else if (!c.speaking && t - lastCatShot >= catEvery && cat === 'stretch')   // waking up isn't doing something (his note)
        away = { cam: 'K', why: 'the cat stretches', until: t + 5 + rand() * 2 };
      if (away && away.cam === 'K' && away.until !== Infinity) lastCatShot = t;
    }
    prevCat = cat;
    if (away && away.until === Infinity && cat !== 'pet') away.until = t + .8;
    if (c.chatCat && c.chatCat > seenChatCat) { seenChatCat = c.chatCat; if (!c.speaking) away = { cam: 'K', why: 'chat asks about the cat', until: t + 5 }; }
    if (c.speaking && c.catSaid && (cat === 'stretch' || cat === 'pet')) return { cam: 'K', why: 'he talks about the cat while she does something' };   // his note: not a dozing cat just because he said her name
    if (away && t < away.until) return away;
    away = null;
    if (WORK.has(c.segment)) {
      if (hands && (c.speaking || !c.typing || t >= hands.until)) hands = null;
      if (!hands && typingSince !== null && t - typingSince >= handsAfter && t - since >= handsAfter) hands = { cam: 'B', why: 'his hands on the keys', until: t + 6 + rand() * 3 };
      return hands || { cam: 'C', why: { play: 'he plays his game', plan: 'he draws the plan', showcase: 'he shows what he made' }[c.segment] || 'he makes it' };
    }
    if (quietSince !== null && t - quietSince >= quietAfter) return cat === 'perch' ? { cam: 'C', why: 'a quiet moment, the cat on his head' } : { cam: 'B', why: 'a quiet moment' };
    return { cam: 'A', why: 'he talks to chat' };
  }
  return {
    /* screen: what the display is showing ({ pane: 'code' | 'design' }) and a showcase's kind ({ show }) */
    layout(segment, screen = {}) {
      if (segment === 'ideas' || segment === 'plan') return 'design';
      if (segment === 'build') return screen.pane === 'design' ? 'design' : 'code';
      if (segment === 'showcase') return screen.show === 'play' ? 'play' : screen.show === 'code' ? 'code' : 'design';
      return segment === 'play' ? 'play' : 'chat';
    },
    get why() { return why; },
    update(t, ctx) {
      const w = want(t, ctx);
      if (cam === null) { cam = w.cam; since = t; why = w.why; }
      else if (w.cam !== cam && ((w.urgent && t - since >= 1.5) || (t - since >= minShot && ctx.boundary !== false))) { cam = w.cam; since = t; why = w.why; }   // nothing flashes: even a big line waits 1.5 s into a shot
      return cam;
    },
  };
}
