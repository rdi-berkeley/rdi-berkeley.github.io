---
layout: blog
title: "CyberGym: Evaluating AI Agents' Real-World Cybersecurity Capabilities at Scale"
---

<img src="overview.png" alt="CyberGym" class="cover-image" style="height: 100%; padding: 15px 15px 15px 30px;">

# CyberGym: Evaluating AI Agents' Real-World Cybersecurity Capabilities at Scale

<div class="author-info">
<strong>
    <a href="mailto:zhun.wang@berkeley.edu">Zhun Wang*</a>, 
    <a href="mailto:stneng@berkeley.edu">Tianneng Shi*</a>,
    <a href="mailto:jingxuan.he@berkeley.edu">Jingxuan He</a>,
    Matthew Cai, Jialin Zhang, Dawn Song
</strong>
<br>
UC Berkeley (* for equal contribution)
<br>
October 8, 2025
<br>
<em>(Est. 3-5 minutes read, more details in <a href="https://cybergym.io" target="_blank">https://cybergym.io</a>)</em>
</div>


*How do we measure frontier AI's real impact on cybersecurity? How can we systematically evaluate AI agents on actual vulnerabilities, not just toy problems?*

To address these questions, we introduce **CyberGym: a large-scale benchmark featuring 1,507 real-world vulnerabilities across 188 widely-used open-source projects**. Unlike coding and educational cybersecurity benchmarks, CyberGym tests AI systems on actual vulnerabilities from production software like OpenSSL and FFmpeg, enabling execution-based, objective evaluation at unprecedented scale (7.5× larger than previous benchmarks).

<img src="time_vs_success.png" alt="Success" class="content-image" style="height: 400px; padding: 10px;">

Our evaluation reveals both the challenge and rapid progress in this domain. Top-performing agents currently achieve only ~20% success rates on CyberGym, showing substantial room for improvement. Yet the pace of advancement is striking: models have progressed from 10% to 30% success rates across recent iterations.
Beyond static benchmarking, we demonstrate AI's practical security impact: agents in our work autonomously **discovered 35 zero-day vulnerabilities and 17 historically incomplete patches**, confirming that AI can now find vulnerabilities at scale. This makes strengthening preparedness for AI's impact on security essential.

CyberGym provides a systematic framework to track these evolving capabilities, enabling organizations to understand and prepare for AI-driven shifts in cybersecurity.
Anthropic has used CyberGym in 
<a href="https://assets.anthropic.com/m/12f214efcc2f457a/original/Claude-Sonnet-4-5-System-Card.pdf">Claude-Sonnet-4.5's system card</a> and <a href="https://red.anthropic.com/2025/ai-for-cyber-defenders/">report</a> evaluating Claude-Sonnet-4.5's cybersecurity capabilities.
In the evaluation, Claude-Sonnet-4.5 achieved a **28.9% success rate** in a single run, which increased to **66.7% with 30 trials**.

However, we must recognize the dual-use nature of these capabilities. While frontier AI can empower defenders to find and remediate vulnerabilities at scale, the same tools could be misused. As AI continues to transform the security landscape, proactive evaluation, responsible disclosure, and staying ahead of emerging risks become critical imperatives.

For further context, explore our companion works:

* <a href="https://rdi.berkeley.edu/frontier-ai-impact-on-cybersecurity/">Frontier AI's Impact on the Cybersecurity Landscape</a>
 — a comprehensive analysis of how frontier AI is transforming cybersecurity and how we can respond.
* <a href="https://rdi.berkeley.edu/frontier-ai-impact-on-cybersecurity/benchmarks.html">Frontier AI Cybersecurity Observatory</a>
 — a live leaderboard tracking AI performance across offensive and defensive cybersecurity tasks.

---

## Key Results and Findings

### Backbone LLMs Differ Significantly in Reproduction Success Rate

We evaluated eleven leading LLMs using the same OpenHands agent framework, including closed-source models, open-weight general-purpose models, and specialized models for SWE-bench and OpenHands.
Thinking modes were disabled to control inference costs, with the exception of o4-mini.

Claude-Sonnet-4 leads overall, achieving a 17.9% success rate, followed by Claude-3.7-Sonnet and GPT-4.1.
Specialized SWE-bench models, despite excelling at software-fix tasks, failed to generalize, each scoring ≤ 2% on this benchmark. This highlights the complementary nature of SWE-bench (focused on general bug fixing) and our benchmark (focused on vulnerability reproduction).
o4-mini underperformed relative to expectations. Analysis showed that its safety alignment caused it to frequently seek user confirmation rather than act autonomously, limiting progress despite strong coding ability elsewhere.

<img src="different_models.png" alt="Different Models" class="content-image" style="height: 300px; padding: 10px;">

### Test-Time Scaling Improves Success Rate

We compare thinking and non-thinking modes on a randomly selected subset of 300 tasks (∼20% of the entire benchmark) using Qwen3-235B-A22B, GPT-5, Claude-3.7-Sonnet, and Claude-Sonnet-4. As illustrated in Figure 4, while the thinking mode yields modest gains over other models, it increases GPT-5’s success rate from 7.7% (with minimal reasoning) to 22.0% (with high reasoning), surpassing Claude-Sonnet-4. This phenomenon is consistent with GPT-5’s results for other benchmarks.

<img src="thinking_vs_nonthinking.png" alt="Thinking Mode" class="content-image" style="height: 250px;">

Furthermore, we run GPT-4.1 on this subset six times.
The "Average" bar represents the mean performance, achieving an average success rate of 8.7 ± 0.7%.
The "Union" bar shows the overall success rate when at least one of the six runs succeeds, reaching 18.0%.
These results demonstrate the significant improvement achieved through test-time scaling and highlight the strong potential of frontier AI in cybersecurity.

<img src="rollout_tmp.png" alt="Rollout" class="content-image" style="height: 250px;">

### Different Agents Show Distinctive Behaviors Despite Similar Success Rates

We evaluate two general-purpose coding agents, OpenHands and OpenAI Codex CLI, alongside two cybersecurity agents for solving CTF problems, EnIGMA and Cybench agent.
We use GPT-4.1 as the backbone LLM, because it achieves a strong balance between cost, rate limits, and success rates.

It shows that all four agents achieve similar success rates overall.
However, when considering the union of outcomes across all agents (i.e., treating the task as successful if any single agent succeeds), the combined success rate reaches 18.4%, nearly doubling the best individual result. This result reveals small success overlap across different agents, highlighting their complementary capabilities. Our further analysis, including detailed tool usage statistics, reveals distinct behavioral patterns among these agents. OpenHands demonstrates proficiency through more efficient tool calls with command chaining in Bash, whereas CTF-specialized agents rely more heavily on writing scripts such as Python to accomplish their tasks.

<img src="different_agents.png" alt="Different Models" class="content-image" style="height: 250px;">

---

## Real-World Security Impact

Beyond benchmarking, CyberGym demonstrates tangible real-world value: the agents not only reproduced known vulnerabilities but also **uncovered incomplete patches and previously unknown zero-day bugs**.

### PoCs Generated for CyberGym Reveal Incomplete Patches

During evaluation, some generated proof-of-concepts (PoCs) unexpectedly caused crashes even on *patched* versions of programs, suggesting that certain fixes were only partial.
Out of all generated PoCs, 759 triggered crashes across 60 projects, and manual inspection confirmed **17 cases of incomplete patches spanning 15 projects**.
While none of these affected the latest software releases, the results show that AI-generated PoCs can help identify flaws in existing security patches that might otherwise go unnoticed.

### PoCs Generated for CyberGym Reveal Zero-Day Vulnerabilities

Further validation of those post-patch crashes revealed 35 PoCs that still crashed the latest versions of their programs.
After deduplication and analysis, these corresponded to **10 unique, previously unknown zero-day vulnerabilities**, each persisting for an average of **969 days** before discovery.

### Running Agentic Vulnerability Discovery at Scale

To test open-ended discovery, we ran OpenHands with GPT-4.1 and GPT-5 using the Level-0 setting (codebase only) across **431 OSS-Fuzz projects** with **1,748 executables**.

* GPT-4.1 triggered **16 crashes**, leading to **7 confirmed zero-days**.
* GPT-5 triggered **56 crashes**, yielding **22 confirmed zero-days**, with 4 overlapping between the two models.

These results confirm that modern LLM agents can autonomously discover new vulnerabilities at scale—and that performance on SysName correlates strongly with real-world vulnerability discovery capability.
All findings were responsibly disclosed, resulting in 3 assigned CVEs and 6 patched vulnerabilities to date.

---

## Benchmark Construction

Below, we detail how CyberGym is built and maintained at scale, from real-world vulnerability sourcing to task design and rigorous quality control.

### Scale and Diversity

CyberGym includes **1,507 vulnerabilities** spanning **188 open-source projects** across domains like networking, cryptography, OS kernels, and multimedia.
Projects include popular ones such as OpenSSL, FFmpeg, and OpenCV, covering a **wide range of codebase sizes** (from tens of thousands to millions of lines) and **28 different crash types** (e.g., buffer overflow, null pointer dereference).
This diversity creates a rich testing ground where stronger agents consistently demonstrate higher success rates.

### Task Design

Each benchmark instance challenges the agent to **reproduce a real-world vulnerability**.
For each task, the agent receives a codebase *before the patch* and a text description of a known vulnerability that includes clues like location, type, and root cause.
The agent must generate a *proof-of-concept (PoC)* that successfully triggers the bug in the pre-patch version while confirming that it no longer appears in the post-patch version.
This setup mirrors the real-world vulnerability reproduction workflow in security research and allows for *execution-based, objective evaluation*.
The success is automatically verified by running the PoC with sanitizers enabled.

### Data Sourcing from OSS-Fuzz

We automatically construct benchmark instances from the **OSS-Fuzz** vulnerability corpus.
By tracing each vulnerability’s **patch commit**, we extract:
(1) pre- and post-patch codebases, and corresponding dockerized build environments;
(2) the original OSS-Fuzz PoC;
(3) the applied patch;
(4) the commit message (which we rephrase using GPT-4.1 to create the vulnerability description).
This process ensures realistic, verifiable data drawn from genuine open-source vulnerabilities.

<img src="vul-life.png" alt="Vulnerability Life Cycle" class="content-image" style="height: 100%; padding: 10px;">

### Quality Assurance

To maintain dataset quality, we apply both automated and manual filtering:

**Informative:** Remove commits lacking detailed vulnerability context or covering multiple fixes.

**Reproducible:** Re-run ground-truth PoCs on pre- and post-patch executables to ensure they behave correctly.

**Non-redundant:** Exclude duplicate or overlapping vulnerabilities identified via crash trace comparison.


### An Example of Successful Agent Trace

An example where CyberGym provides the vulnerability description and the pre-patch codebase, and the agent successfully reproduces the target vulnerability based on the provided description and codebase. The agent begins by browsing relevant files using the given keywords, constructs a test case using the retrieved information, mutates the test case, and ultimately triggers the crash.

<img src="case_study.png" alt="Example Trace" class="content-image" style="width: 800px; padding: 10px; overflow:visible;">

---

If you find this blog useful, we would appreciate it if you could cite our work:

```
@misc{wang2025cybergym,
      title={CyberGym: Evaluating AI Agents' Cybersecurity Capabilities with Real-World Vulnerabilities at Scale},
      author={Zhun Wang and Tianneng Shi and Jingxuan He and Matthew Cai and Jialin Zhang and Dawn Song},
      year={2025},
      eprint={2506.02548},
      archivePrefix={arXiv},
      primaryClass={cs.CR},
      url={https://arxiv.org/abs/2506.02548},
}
```
