---
name: explain
description: "Explain a subsystem, change, or diff plainly so the person understands it: what it is, how it works, and why it is built that way. Runs how and why and weaves the results into one account. Use for 'explain this', 'help me understand X', 'walk me through this change'. Not for learning a new topic over many sessions (use learn)."
---
<!-- ported from cursor/plugins pstack@101b274 (MIT), renamed from teach, see THIRD_PARTY.md -->

# Explain

Explain what a thing is, how it works, and why it is built that way, in one plain account at the person's pace. The goal is understanding, not change. Read-only.

1. Decide the few things the person should walk away with. Infer them from why they ask (about to change it, reviewing it, debugging it, new to it) and what they already know, from the conversation. Skip what they plainly know. Put depth where their question is.
2. Read the code to get oriented. Then follow `how` for the mechanics and `why` for the reasons. Run both for a subsystem; one may be enough for a small change. Keep `why` narrow by default (git plus one or two sources) and widen it only when the reasons are the point.
3. Start with a plain definition, the way a senior engineer would say it out loud. Tie it to the case in front of you, then build: how it works, the reasons, the edge cases. Explain each part so it clicks: the problem it solves and how it works. Walk through what happens as a user does the thing when that makes it land. A list of functions is reference, not explanation.
4. Give the smallest complete answer first, a sentence or two, and stop. Add layers when asked. Keep `why`'s confidence language intact: its hedges are findings.
5. Draw only when a picture lands faster than words. For three or more moving parts, draw a short series where each diagram adds one part, not one diagram with everything.
6. Keep it a conversation. No quizzes, no "pause" markers, no "the key insight is". Offer to go deeper at the end.

Write in plain spoken language, following the `unslop` rules. Name each concept once and keep the name. Reply with the explanation itself, not a report about what you did.
