---
layout: blog
title: "CyberGym-E2E: Scalable Real-World Benchmark for AI Agents' End-to-End Cybersecurity Capabilities"
---

<img src="images/overview.png" alt="CyberGym-E2E" class="cover-image" style="height: 100%; padding: 15px 15px 15px 30px;">

# CyberGym-E2E: Scalable Real-World Benchmark for AI Agents' End-to-End Cybersecurity Capabilities

<div class="author-info">
<strong>
    <a href="mailto:stneng@berkeley.edu">Tianneng Shi</a><sup>1</sup>*,
    Robin Rheem<sup>1</sup>*,
    Dongwei Jiang<sup>2</sup>,
    Mona Wang<sup>1</sup>,
    Francisco De La Riega<sup>1</sup>,
    Zhun Wang<sup>1</sup>,
    Jingzhi Jiang<sup>1</sup>,
    Alexander Cheung<sup>1</sup>,
    Sean Tai<sup>1</sup>,
    Jonah Cha<sup>1</sup>,
    Jianhong Tu<sup>3</sup>,
    Gabriel Han<sup>1</sup>,
    Chenguang Wang<sup>3</sup>,
    Jingxuan He<sup>1</sup>,
    Wenbo Guo<sup>4</sup>,
    Dawn Song<sup>1</sup>
</strong>
<br>
<sup>1</sup>UC Berkeley, <sup>2</sup>Johns Hopkins University, <sup>3</sup>UC Santa Cruz, <sup>4</sup>UC Santa Barbara
(* for equal contribution)
<br>
June 18, 2026
<br>
<em>(Est. ~5 minutes read, more details in the <a href="https://arxiv.org/abs/2606.04460" target="_blank">paper</a>)</em>
</div>

Our earlier benchmark, [CyberGym](https://rdi.berkeley.edu/blog/cybergym/), asked whether AI agents could reproduce real-world vulnerabilities. This work closes the loop on the defensive side and asks the question that matters most for the people who have to keep software safe:

*Can an AI agent run the entire defensive lifecycle on real software — independently discover a vulnerability, prove it with a working input, and then ship a patch that fixes it without breaking anything else?*

## TL;DR

**CyberGym-E2E** is a large-scale, end-to-end cybersecurity benchmark of **920 real-world vulnerabilities across 139 widely used open-source projects**. Unlike benchmarks that test a single slice of the lifecycle, each task asks an agent to do the whole job: locate the vulnerability in a real codebase, generate a proof-of-concept (PoC) that triggers a sanitizer crash, and write a patch that fixes the vulnerability while still passing the functionality tests.

The headline finding: The strongest configurations fix vulnerabilities ~80% of the time when given the vulnerability. But when the agent has to find the vulnerability itself, end-to-end success drops sharply. Moreover, agents don't always find the intended vulnerability: when we check whether the patch addresses the specific ground-truth vulnerability rather than just any valid vulnerability in the repo, success rates drop further.

## Key Takeaways

**Discovery is relatively harder than remediation.** When agents are given the ground-truth PoC and crash log (the patch-only setting), the best models succeed on ~80% of tasks — strong, but with meaningful room to improve. When the same agents have to discover the vulnerability themselves first, end-to-end success collapses — to 19.2% for Claude Opus 4.5 and to the 37–66% range for the newest models. Independently locating a vulnerable code path in a multi-hundred-thousand-line repository is the harder part; once a vulnerability is pinned down, today's models patch it reasonably well.

**Agents may discover an alternative vulnerability.** There's a consistent gap between S3 (tests pass) and S4 (the patch fixes the original ground-truth vulnerability). This isn't the agent doing anything wrong — the task never specifies which vulnerability to find, and real projects contain multiple vulnerabilities. While exploring, agents frequently discover and patch a perfectly valid vulnerability that simply isn't the one in our ground-truth data. S3 counts those as the successes they are; S4 is a finer-grained diagnostic that tells us how often the agent converged on the specific intended vulnerability, which is the harder target.

**Alternative and shallow patches.** A vulnerability can often be fixed in many different ways, and we observe that many successful agent patches address the same root cause as the ground-truth patch but at a different location. This justifies grading behaviorally rather than by patch similarity, which would falsely reject most legitimate fixes. However, we also observe a small fraction of patches are shallow, inserting a defensive guard at the sanitizer-reported crash frame while leaving the underlying defect untouched. This suggests that agent-produced patches should be treated as candidates for further review rather than drop-in fixes. In this work we focus on verifiable, execution-based judging, so shallow patches that pass all validation stages are still counted as successful; incorporating an additional LLM-based judge to analyze patch quality would be a useful complement.

**Newer frontier models are closing the gap fast.** On the expanded 920-task benchmark, GPT-5.4 reaches 66.2% end-to-end success (S3) — more than triple the prior generation's ~20%. Given an uncapped budget, Claude Opus 4.6 climbs to ~63% on S3. The trajectory mirrors what we saw with the original CyberGym: this capability is moving quickly, and benchmarks need to keep pace.

**This is dual-use, and that's exactly why we built it.** The same agentic capability that helps defenders triage, reproduce, and remediate vulnerabilities at scale could lower the barrier for offensive misuse. We deliberately frame CyberGym-E2E around the full defensive lifecycle — including patch generation — rather than offense alone, and every vulnerability in the benchmark was already publicly disclosed and remediated before inclusion. Transparent, rigorous measurement of these capabilities is how defenders, model developers, and policymakers stay ahead.

## What Is CyberGym-E2E?

Most cybersecurity benchmarks for AI cover only part of the vulnerability life-cycle — detection, or PoC generation, or patching — and often construct each stage in isolation. But these stages are tightly coupled in practice, and a unified benchmark that follows a single vulnerability from discovery through fix is what reveals an agent's true end-to-end capability. CyberGym-E2E is, to our knowledge, the first benchmark to combine vulnerability detection, PoC generation, patch generation, post-patch functionality testing, a realistic agentic environment, and end-to-end evaluation at this scale.

**The task.** Each instance gives the agent a vulnerable codebase, build scripts, and test scripts. In the end-to-end setting, all ground-truth data is withheld: the agent must discover the vulnerability, craft an input that triggers a sanitizer crash, and produce a patch — mirroring the full workflow of a security researcher. In the patch-only setting, the agent receives the ground-truth PoC and crash log, isolating the task to root-cause analysis and patching.

**A realistic environment.** Rather than handing the agent read-only access to a single vulnerable function, CyberGym-E2E places it directly inside the project's build environment, the way a coding agent is actually deployed by an engineer.

**How success is measured.** Outputs run through four validation stages: **(S1)** the agent's PoC crashes the unpatched build; **(S2)** the patch fixes that crash; **(S3)** the patched project still passes its developer-written functionality tests; and a diagnostic **(S4)** that checks whether the patch also fixes the target ground-truth vulnerability. Passing S1–S3 counts as a successful discover-and-patch; S4 tells us whether the agent fixed the intended vulnerability or a different one.

**Built by an automated, agent-enhanced pipeline.** We source historical vulnerabilities from Google's OSS-Fuzz, identify the clean patch commit, reconstruct vulnerable and patched builds (migrating legacy environments to modern toolchains so today's agents can run), and use a coding agent to locate, build, and run each project's own unit tests for functionality checking. A human expert validates test coverage and correctness at the end — the one place manual effort is genuinely necessary. The pipeline is aggressive about quality: it filters out roughly half of candidates for uninformative or sprawling patch commits, drops more for build/PoC-reproduction failures, and only keeps tasks where developer tests give sufficient coverage around the vulnerable code.

<figure style="text-align: center; margin: 1em 0;">
  <img src="images/overview.png" alt="Overview of benchmark task settings and agent evaluation" style="width: 100%;">
  <figcaption style="margin-top: 0.5em; font-size: 0.9em; text-align: left;"><em>Figure 1: Overview of benchmark task settings and agent evaluation.</em></figcaption>
</figure>



## The Main Results

We evaluated frontier models across four agent harnesses — Claude Code, OpenAI Codex, Gemini CLI, and OpenHands — under a uniform budget of $10 and 90 minutes per task.

On the initial 615-task set, the pattern is stark. The best patch-only configuration (Claude Opus 4.5 with Claude Code) reaches 82.3%, but the same model drops to 19.2% end-to-end. Different models lead at different stages: GPT-5.2-Codex and Gemini 3 Pro are stronger at the discovery stage (S1), while Opus 4.5 is the strongest patcher — but because the stages are cumulative, weak discovery caps the end-to-end score regardless of patching skill.

<figure style="text-align: center; margin: 1em 0; overflow-x: auto;">
<table style="margin: 0 auto; border-collapse: collapse; font-size: 0.9em;">
  <thead>
    <tr style="border-top: 2px solid #000; border-bottom: 1px solid #000;">
      <th style="padding: 6px 10px; text-align: left;">Model</th>
      <th style="padding: 6px 10px; text-align: left;">Harness</th>
      <th style="padding: 6px 10px; text-align: right;">Patch-only</th>
      <th style="padding: 6px 10px; text-align: right;">S1</th>
      <th style="padding: 6px 10px; text-align: right;">S2</th>
      <th style="padding: 6px 10px; text-align: right;">S3</th>
      <th style="padding: 6px 10px; text-align: right;">S4</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 4px 10px; text-align: left;">Opus 4.5</td>
      <td style="padding: 4px 10px; text-align: left;">Claude Code</td>
      <td style="padding: 4px 10px; text-align: right;">82.3</td>
      <td style="padding: 4px 10px; text-align: right;">24.9</td>
      <td style="padding: 4px 10px; text-align: right;">21.9</td>
      <td style="padding: 4px 10px; text-align: right;">19.2</td>
      <td style="padding: 4px 10px; text-align: right;">7.6</td>
    </tr>
    <tr>
      <td style="padding: 4px 10px; text-align: left;">Sonnet 4.5</td>
      <td style="padding: 4px 10px; text-align: left;">Claude Code</td>
      <td style="padding: 4px 10px; text-align: right;">77.4</td>
      <td style="padding: 4px 10px; text-align: right;">18.1</td>
      <td style="padding: 4px 10px; text-align: right;">12.1</td>
      <td style="padding: 4px 10px; text-align: right;">10.6</td>
      <td style="padding: 4px 10px; text-align: right;">3.4</td>
    </tr>
    <tr>
      <td style="padding: 4px 10px; text-align: left;">Sonnet 4.5</td>
      <td style="padding: 4px 10px; text-align: left;">OpenHands</td>
      <td style="padding: 4px 10px; text-align: right;">68.9</td>
      <td style="padding: 4px 10px; text-align: right;">9.3</td>
      <td style="padding: 4px 10px; text-align: right;">7.2</td>
      <td style="padding: 4px 10px; text-align: right;">5.4</td>
      <td style="padding: 4px 10px; text-align: right;">2.3</td>
    </tr>
    <tr>
      <td style="padding: 4px 10px; text-align: left;">GPT-5.2-Codex</td>
      <td style="padding: 4px 10px; text-align: left;">Codex</td>
      <td style="padding: 4px 10px; text-align: right;">58.5</td>
      <td style="padding: 4px 10px; text-align: right;">30.2</td>
      <td style="padding: 4px 10px; text-align: right;">22.0</td>
      <td style="padding: 4px 10px; text-align: right;">20.7</td>
      <td style="padding: 4px 10px; text-align: right;">6.5</td>
    </tr>
    <tr style="border-bottom: 2px solid #000;">
      <td style="padding: 4px 10px; text-align: left;">Gemini 3 Pro</td>
      <td style="padding: 4px 10px; text-align: left;">Gemini CLI</td>
      <td style="padding: 4px 10px; text-align: right;">77.6</td>
      <td style="padding: 4px 10px; text-align: right;">29.6</td>
      <td style="padding: 4px 10px; text-align: right;">23.6</td>
      <td style="padding: 4px 10px; text-align: right;">22.6</td>
      <td style="padding: 4px 10px; text-align: right;">5.0</td>
    </tr>
  </tbody>
</table>
<figcaption style="margin-top: 0.5em; font-size: 0.9em; text-align: left;"><em>Table 1: Success rates (%) on the initial 615 tasks. Stages are cumulative — Sₙ requires passing S1…Sₙ₋₁. All runs used a $10 / 90-minute budget.</em></figcaption>
</figure>

On the expanded 920-task benchmark with newer models, end-to-end performance jumps sharply. GPT-5.4 reaches 66.2% end-to-end (S3), and Claude Opus 4.6 — whose per-token cost means many capped runs terminate early — climbs from 37.9% under the $10 cap to 62.6% uncapped.

<figure style="text-align: center; margin: 1em 0; overflow-x: auto;">
<table style="margin: 0 auto; border-collapse: collapse; font-size: 0.9em;">
  <thead>
    <tr style="border-top: 2px solid #000; border-bottom: 1px solid #000;">
      <th style="padding: 6px 10px; text-align: left;">Model</th>
      <th style="padding: 6px 10px; text-align: left;">Harness</th>
      <th style="padding: 6px 10px; text-align: right;">Patch-only</th>
      <th style="padding: 6px 10px; text-align: right;">S1</th>
      <th style="padding: 6px 10px; text-align: right;">S2</th>
      <th style="padding: 6px 10px; text-align: right;">S3</th>
      <th style="padding: 6px 10px; text-align: right;">S4</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 4px 10px; text-align: left;">Opus 4.6</td>
      <td style="padding: 4px 10px; text-align: left;">Claude Code</td>
      <td style="padding: 4px 10px; text-align: right;">84.1</td>
      <td style="padding: 4px 10px; text-align: right;">39.7</td>
      <td style="padding: 4px 10px; text-align: right;">39.5</td>
      <td style="padding: 4px 10px; text-align: right;">37.9</td>
      <td style="padding: 4px 10px; text-align: right;">15.7</td>
    </tr>
    <tr>
      <td style="padding: 4px 10px; text-align: left;">GPT-5.4</td>
      <td style="padding: 4px 10px; text-align: left;">Codex</td>
      <td style="padding: 4px 10px; text-align: right;">87.1</td>
      <td style="padding: 4px 10px; text-align: right;">67.9</td>
      <td style="padding: 4px 10px; text-align: right;">66.2</td>
      <td style="padding: 4px 10px; text-align: right;">65.9</td>
      <td style="padding: 4px 10px; text-align: right;">22.2</td>
    </tr>
    <tr>
      <td style="padding: 4px 10px; text-align: left;">Gemini 3.1 Pro</td>
      <td style="padding: 4px 10px; text-align: left;">Gemini CLI</td>
      <td style="padding: 4px 10px; text-align: right;">83.0</td>
      <td style="padding: 4px 10px; text-align: right;">47.4</td>
      <td style="padding: 4px 10px; text-align: right;">44.3</td>
      <td style="padding: 4px 10px; text-align: right;">43.8</td>
      <td style="padding: 4px 10px; text-align: right;">20.5</td>
    </tr>
    <tr style="border-bottom: 2px solid #000;">
      <td style="padding: 4px 10px; text-align: left;">Opus 4.6 (no cap)</td>
      <td style="padding: 4px 10px; text-align: left;">Claude Code</td>
      <td style="padding: 4px 10px; text-align: right;">85.8</td>
      <td style="padding: 4px 10px; text-align: right;">66.3</td>
      <td style="padding: 4px 10px; text-align: right;">65.0</td>
      <td style="padding: 4px 10px; text-align: right;">62.6</td>
      <td style="padding: 4px 10px; text-align: right;">26.2</td>
    </tr>
  </tbody>
</table>
<figcaption style="margin-top: 0.5em; font-size: 0.9em; text-align: left;"><em>Table 2: Success rates (%) on the expanded 920-task benchmark, same protocol as Table 1 ($10 / 90 min, plus an uncapped Opus 4.6 row).</em></figcaption>
</figure>

## The Interesting Bits

**Budget matters.** Success rates rise steadily with the cost budget before flattening out. Patch-only performance plateaus early (most models are near their ceiling by a few dollars), but end-to-end discovery keeps benefiting from more runway. The $10 cap is an evaluation choice for fair cross-model comparison, not a property of the dataset — researchers with more resources can push further.

<figure style="text-align: center; margin: 1em 0;">
  <img src="images/cost_scaling_frontier.png" alt="Pass rate vs cost across frontier models" style="width: 100%;">
  <figcaption style="margin-top: 0.5em; font-size: 0.9em; text-align: left;"><em>Figure 2: End-to-end (left) and patch-only (right) pass rate as a function of per-task cost budget, up to $10. Patch-only plateaus quickly; end-to-end discovery keeps climbing.</em></figcaption>
</figure>

That last point is most visible when we lift Opus 4.6's cap entirely. Its patch-only curve plateaus near 86% almost immediately, but its end-to-end curve keeps rising out to ~$30+, eventually reaching ~63% — strong evidence that the strongest agents are capable of sustained, multi-stage reasoning that a tight budget undercounts.

<figure style="text-align: center; margin: 1em 0;">
  <img src="images/cost_scaling_opus_uncapped.png" alt="Opus 4.6 uncapped pass rate vs cost" style="width: 100%;">
  <figcaption style="margin-top: 0.5em; font-size: 0.9em; text-align: left;"><em>Figure 3: With the cost cap removed, Claude Opus 4.6's end-to-end success keeps climbing toward ~63%, while patch-only plateaus almost immediately near 86%.</em></figcaption>
</figure>

**The S3–S4 gap up close.** As discussed in the takeaways, agents frequently fix a valid but unintended vulnerability. One promising direction for closing this gap is to instruct agents to keep searching after fixing their first vulnerability — enumerating and patching all discoverable vulnerabilities in a region rather than stopping at the first success — or more broadly, to ask the agent to find and fix as many vulnerabilities as it can in the same run.

## Example: From a Browse to a Fix in GraphicsMagick

To make the workflow concrete, here is a representative successful end-to-end trajectory. Given only the GraphicsMagick codebase, the agent parses the task, browses the source tree, and uses targeted search (`grep`, `find`) to home in on `ReadMNGImage()` in `coders/png.c`. It examines the code around the `mng_LOOP` chunk handling, inspects a sample MNG file's byte layout, and constructs a minimal malformed MNG input — just a header plus a truncated `LOOP` chunk — that triggers a heap-buffer-overflow. The validation script confirms the crash (S1). The agent then writes a small bounds-check patch, but its first attempt fails to fully stop the crash; it iterates, mutating the fix until the patched build both eliminates the crash and passes the project's functionality tests (S2 and S3). The whole discover-prove-fix loop unfolds in a couple dozen execution steps — the same systematic pattern we see across successful runs: parse the description, search, analyze the vulnerable path, build a PoC, then refine against feedback.

<figure style="text-align: center; margin: 1em 0;">
  <img src="images/trajectory.png" alt="Example agent trajectory" style="width: 100%;">
  <figcaption style="margin-top: 0.5em; font-size: 0.9em; text-align: left;"><em>Figure 4: An end-to-end trajectory on GraphicsMagick — locating the vulnerability in <code>ReadMNGImage()</code>, building a minimal MNG proof-of-concept, and iteratively refining a patch until all validation stages pass.</em></figcaption>
</figure>

## Why This Matters

CyberGym-E2E makes one thing measurable and concrete: today's frontier agents are frequently able to produce a passing fix once the vulnerability is localized, and the larger gap is about autonomous discovery — a gap the newest models are closing quickly. For defenders, that's an actionable signal: automated end-to-end remediation could accelerate triage and patching, with human review still in the loop, since not every passing patch is a clean fix.

The benchmark contributes to both sides of the responsible-development equation: it gives defenders a realistic, execution-grounded way to measure how much an AI agent can do across the full lifecycle, and it gives model developers a way to track these capabilities where the stakes are unusually high. Because the construction pipeline is automated and continues to ingest new OSS-Fuzz vulnerabilities, the benchmark can scale alongside both the models and the evolving vulnerability landscape.

---

The dataset is available at [github.com/sunblaze-ucb/cybergym-e2e](https://github.com/sunblaze-ucb/cybergym-e2e).

If you find this work useful, please cite our paper:

```
@inproceedings{shi2026cybergyme2e,
  title={CyberGym-E2E: Scalable Real-World Benchmark for AI Agents' End-to-End Cybersecurity Capabilities},
  author={Shi, Tianneng and Rheem, Robin and Jiang, Dongwei and Wang, Mona and De La Riega, Francisco and Wang, Zhun and Jiang, Jingzhi and Cheung, Alexander and Tai, Sean and Cha, Jonah and Tu, Jianhong and Han, Gabriel and Wang, Chenguang and He, Jingxuan and Guo, Wenbo and Song, Dawn},
  booktitle={Proceedings of the 43rd International Conference on Machine Learning},
  year={2026},
  url={https://arxiv.org/abs/2606.04460},
}
```
