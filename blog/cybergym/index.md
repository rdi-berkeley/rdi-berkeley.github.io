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

## TL;DR

We introduce <strong>CyberGym, a large-scale benchmark
featuring 1,507 real-world vulnerabilities across 188 software projects</strong>.
On CyberGym, even the top-performing combinations only achieve a ∼20% success rate.
Beyond static benchmarking,
we show that CyberGym leads to the <strong>discovery of 35 zero-day vulnerabilities and
17 historically incomplete patches</strong>, highlighting that frontier AIs are reshaping the cybersecurity landscape.

## Benchmark Construction

### Task Design

In our benchmark, the agent’s main challenge is to **reproduce real-world vulnerabilities**. Each instance provides a codebase _before the patch_ and a text description of a known vulnerability that includes clues like location, type, and root cause.
The agent must generate a _proof-of-concept (PoC)_ that successfully triggers the bug in the pre-patch version while confirming that it no longer appears in the post-patch version.
This setup mirrors the real-world vulnerability reproduction workflow in security research and allows for _execution-based, objective evaluation_.
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

### Multi-Level Difficulty

To measure different levels of reasoning ability, we define four difficulties:

**Level 0:** Only the pre-patch codebase is provided (no description), enabling open-ended vulnerability discovery.

**Level 1:** The agent receives both the pre-patch code and a vulnerability description, i.e., the primary task.

**Level 2:** Adds the crash stack trace generated from the ground-truth PoC, helping the agent locate the issue.

**Level 3:** Includes the patch diff and post-patch code, offering insights similar to one-day vulnerability analysis.

### Quality Assurance

To maintain dataset quality, we apply both automated and manual filtering:

**Informative:** Remove commits lacking detailed vulnerability context or covering multiple fixes.

**Reproducibile:** Re-run ground-truth PoCs on pre- and post-patch executables to ensure they behave correctly.

**Non-redundant:** Exclude duplicate or overlapping vulnerabilities identified via crash trace comparison.

### Scale and Diversity

The final benchmark contains **1,507 vulnerabilities** spanning **188 open-source projects** across domains like networking, cryptography, OS kernels, and multimedia.
Projects include popular ones such as OpenSSL, FFmpeg, and OpenCV, covering a **wide range of codebase sizes** (from tens of thousands to millions of lines) and **28 different crash types** (e.g., buffer overflow, null pointer dereference).
This diversity creates a rich testing ground where stronger agents consistently demonstrate higher success rates.

### An Example of Successful Agent Trace

An example where CyberGym provides the vulnerability description and the pre-patch codebase, and the agent successfully reproduces the target vulnerability based on the provided description and codebase. The agent begins by browsing relevant files using the given keywords, constructs a test case using the retrieved information, mutates the test case, and ultimately triggers the crash.

<img src="case_study.png" alt="Example Trace" class="content-image" style="width: 800px; padding: 10px; overflow:visible;">

## Evaluation Results

### Backbone LLMs Differ Significantly in Reproduction Success Rate

We evaluated eleven leading LLMs using the same OpenHands agent framework, including closed-source models, open-weight general-purpose models, and specialized models for SWE-bench and OpenHands.
Thinking modes were disabled to control inference costs, with the exception of o4-mini.

Claude-Sonnet-4 leads overall, achieving a 17.9% success rate, followed by Claude-3.7-Sonnet and GPT-4.1.
Specialized SWE-bench models, despite excelling at software-fix tasks, failed to generalize, each scoring ≤ 2% on this benchmark. This highlights the complementary nature of SWE-bench (focused on bug fixing) and our benchmark (focused on vulnerability reproduction).
o4-mini underperformed relative to expectations. Analysis showed that its safety alignment caused it to frequently seek user confirmation rather than act autonomously, limiting progress despite strong coding ability elsewhere.

<img src="different_models.png" alt="Different Models" class="content-image" style="height: 300px; padding: 10px;">

### Thinking Mode Improves Success Rate

We compare thinking and non-thinking modes on a randomly selected subset of 300 tasks (∼20% of the entire benchmark) using Qwen3-235B-A22B, GPT-5, Claude-3.7-Sonnet, and Claude-Sonnet-4. As illustrated in Figure 4, while the thinking mode yields modest gains over other models, it increases GPT-5’s success rate from 7.7% (with minimal reasoning) to 22.0% (with high reasoning), surpassing Claude-Sonnet-4. This phenomenon is consistent with GPT-5’s results for other benchmarks.

<img src="thinking_vs_nonthinking.png" alt="Different Models" class="content-image" style="height: 250px;">

### Different Agents Show Distinctive Behaviors Despite Similar Success Rates

We evaluate two general-purpose coding agents, OpenHands and OpenAI Codex CLI, alongside two cybersecurity agents for solving CTF problems, EnIGMA and Cybench agent.
We use GPT-4.1 as the backbone LLM, because it achieves a strong balance between cost, rate limits, and success rates.

It shows that all four agents achieve similar success rates overall.
However, when considering the union of outcomes across all agents (i.e., treating the task as successful if any single agent succeeds), the combined success rate reaches 18.4%, nearly doubling the best individual result. This result reveals small success overlap across different agents, highlighting their complementary capabilities. Our further analysis, including detailed tool usage statistics, reveals distinct behavioral patterns among these agents. OpenHands demonstrates proficiency through more efficient tool calls with command chaining in Bash, whereas CTF-specialized agents rely more heavily on writing scripts such as Python to accomplish their tasks.

<img src="different_agents.png" alt="Different Models" class="content-image" style="height: 250px;">

## Real-World Security Impact

Beyond benchmarking, CyberGym demonstrates tangible real-world value: the agents not only reproduced known vulnerabilities but also **uncovered incomplete patches and previously unknown zero-day bugs**.

### PoCs Generated for CyberGym Reveal Incomplete Patches

During evaluation, some generated proof-of-concepts (PoCs) unexpectedly caused crashes even on _patched_ versions of programs, suggesting that certain fixes were only partial.
Out of all generated PoCs, 759 triggered crashes across 60 projects, and manual inspection confirmed **17 cases of incomplete patches spanning 15 projects**.
While none of these affected the latest software releases, the results show that AI-generated PoCs can help identify flaws in existing security patches that might otherwise go unnoticed.

### PoCs Generated for CyberGym Reveal Zero-Day Vulnerabilities

Further validation of those post-patch crashes revealed 35 PoCs that still crashed the latest versions of their programs.
After deduplication and analysis, these corresponded to **10 unique, previously unknown zero-day vulnerabilities**, each persisting for an average of **969 days** before discovery.

### Running Agentic Vulnerability Discovery at Scale

To test open-ended discovery, we ran OpenHands with GPT-4.1 and GPT-5 using the Level-0 setting (codebase only) across **431 OSS-Fuzz projects** with **1,748 executables**.

- GPT-4.1 triggered **16 crashes**, leading to **7 confirmed zero-days**.
- GPT-5 triggered **56 crashes**, yielding **22 confirmed zero-days**, with 4 overlapping between the two models.

These results confirm that modern LLM agents can autonomously discover new vulnerabilities at scale—and that performance on SysName correlates strongly with real-world vulnerability discovery capability.
All findings were responsibly disclosed, resulting in 3 assigned CVEs and 6 patched vulnerabilities to date.

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

Please check out more of our works:
<a href="https://rdi.berkeley.edu/frontier-ai-impact-on-cybersecurity/">Frontier AI's Impact on the Cybersecurity Landscape</a>
, a comprehensive analysis of how frontier AI is reshaping cybersecurity and how we should respond.
Also see our
<a href="https://rdi.berkeley.edu/frontier-ai-impact-on-cybersecurity/benchmarks.html">Frontier AI Cybersecurity Observatory</a>
, a live leaderboard tracking AI's cybersecurity capabilities across attack and defense tasks.
