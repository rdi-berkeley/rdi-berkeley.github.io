/* ---------- hover cards for the two hubs: LiteSample (code.ls) and lite.gym (code.lg) ----------
   Shared by every page: one implementation, one look (styles in css/style.css, .ls-pop).
   Grounded in the main repo: lite/types.py:352-386 (LiteSample), lite/gym/base.py:28-97 +
   lite/gym/types.py:35-62 (LiteBaseEnv / observation / step result). */
(function () {
  "use strict";
  const CARDS = {
    "span.stage-preproc": {
      title: "preproc",
      code:
`<span class="t-dim"># preproc — a raw dataset becomes LiteSample, once</span>
lite/data/preproc/&lt;dataset&gt;/
    use.py · grounding-*.py     <span class="t-dim"># the converters</span>
    coordinates → <span class="t-str">[0, 1000]</span>     <span class="t-dim"># normalized, always</span>
    images → content-addressed store

<span class="t-dim"># run it, then publish to the Hub ↓</span>
$ bash lite/data/preproc/scalecua/scripts/process_data.sh
$ python -m lite.data.hf.upload ScaleCUA <span class="t-str">--org cua-lite</span>`,
    },
    "span.stage-adapter, code.ad": {
      title: "adapter",
      code:
`<span class="t-dim"># the adapter — one per model family</span>
<span class="t-kw">class</span> BaseAgentAdapter:
    action_space: BaseActionSpace  <span class="t-dim"># its coordinates</span>
    protocol: BaseProtocol         <span class="t-dim"># its history</span>
    <span class="t-kw">def</span> render_step(sample, k, processed)
        <span class="t-dim"># → the messages the model sees at turn k</span>
    <span class="t-kw">def</span> unroll(sample)  <span class="t-dim"># → AgentSample, every turn</span>

<span class="t-dim"># the same adapter serves rollout and export_sft —</span>
<span class="t-dim"># the SFT prompt matches what the model saw live</span>`,
    },
    "code.ls": {
      title: "LiteSample",
      code:
`<span class="t-dim"># LiteSample — one schema for any data</span>
<span class="t-kw">@dataclass</span>
<span class="t-kw">class</span> LiteSample:
    metadata: LiteMetadata       <span class="t-dim"># platform · task_type</span>
    images:   list[Image]        <span class="t-dim"># screenshots</span>
    messages: list[LiteMessage]  <span class="t-dim"># user ⇄ assistant turns</span>

<span class="t-dim"># a grounding step — one action ↓</span>
LiteSample(
  LiteMetadata(<span class="t-str">"desktop"</span>, <span class="t-str">"grounding.action"</span>),
  messages=[
    user(<span class="t-str">"Click Subscribe"</span>, img=0),
    assistant(click(<span class="t-str">[455, 215]</span>)),
  ])

<span class="t-dim"># a use trajectory — 2 steps ↓</span>
LiteSample(
  LiteMetadata(<span class="t-str">"browser"</span>, <span class="t-str">"use"</span>),
  messages=[
    user(<span class="t-str">"Find cua-lite on GitHub"</span>, img=0),
    assistant(type(<span class="t-str">"cua-lite"</span>)),
    user(img=1),                  <span class="t-dim"># result screenshot</span>
    assistant(click(<span class="t-str">[320, 180]</span>), terminate()),
  ])`,
    },
    "code.lg": {
      title: "lite.gym",
      code:
`<span class="t-dim"># lite.gym — every env behind one interface</span>
<span class="t-kw">class</span> LiteBaseEnv:
    metadata: LiteMetadata     <span class="t-dim"># platform · extra tools</span>
    <span class="t-kw">async def</span> reset()        <span class="t-dim"># first screenshot + task</span>
    <span class="t-kw">async def</span> step(actions)  <span class="t-dim"># execute, observe, reward</span>
    <span class="t-kw">async def</span> close()

<span class="t-dim"># one step of the loop ↓</span>
env = gym.make(<span class="t-str">"osworld@&lt;task_id&gt;"</span>)
result = <span class="t-kw">await</span> env.step([
  click(coordinate=<span class="t-str">[500, 400]</span>),  <span class="t-dim"># normalized [0, 1000]</span>
])
result.observation.screenshot_b64   <span class="t-dim"># base64 png, no prefix</span>
result.reward                       <span class="t-dim"># float | None</span>
result.terminated, result.truncated`,
    },
  };
  Object.entries(CARDS).forEach(([sel, card]) => {
    document.querySelectorAll(sel).forEach((chip) => {
      const pop = document.createElement("span");
      pop.className = "ls-pop"; pop.setAttribute("aria-hidden", "true");
      pop.innerHTML =
        '<span class="ls-bar"><span class="d"></span><span class="d"></span><span class="d"></span><span class="ls-t">' +
        card.title + "</span></span>" +
        '<pre class="ls-code">' + card.code + "</pre>";
      chip.appendChild(pop);
      // keep the card inside the viewport: shift it left when the anchor sits too far right
      chip.addEventListener("pointerenter", () => {
        pop.style.marginLeft = "";
        const over = pop.getBoundingClientRect().right - (innerWidth - 10);
        if (over > 0) pop.style.marginLeft = -over + "px";
      });
    });
  });
})();
