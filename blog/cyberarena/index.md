---
layout: blog
title: "CyberArena: Benchmarking AI Agents in Live Symmetric Attack-and-Defense Combat"
description: "Two AI agents attack each other's live service while patching their own. Across 466 games between 12 frontier agents, CyberArena separates two leaders from the field and turns challenges that agents solve alone into hard ones once a defender fights back."
---

<style>
.blog-post ul { list-style-type: disc; padding-left: 2rem; }
.blog-post ol { list-style-type: decimal; padding-left: 2rem; }
.blog-post .cyberarena-figure { margin: 2rem auto; }
.blog-post .cyberarena-figure img { width: 100%; max-width: 100%; height: auto; margin: 1rem auto; }
.blog-post .cyberarena-figure img.cyberarena-narrow { max-width: 480px; }
.blog-post .cyberarena-figure figcaption { font-size: 0.95rem; line-height: 1.6; color: #555; }
</style>

<img src="images/main.png" alt="CyberArena: 12 frontier agents, 40 challenges, 466 ranked games. Overall ranking led by GPT-5.6 Sol at 78.6, Claude Opus 5 at 73.8 and GLM-5.3 at 68.5, with attack ability plotted against defense ability." class="cover-image">

# CyberArena: Benchmarking AI Agents in Live Symmetric Attack-and-Defense Combat

<div class="author-info">
<strong>
    Bangya Liu<sup>1,5,*</sup>,
    Jianhong Tu<sup>2,*</sup>,
    Yueyang Pan<sup>1,*</sup>,
    Hanhong Zhao<sup>6,*</sup>,
    Zhe Ye<sup>3</sup>,
    Hongwei Li<sup>4</sup>,
    Saastha Vasan<sup>4</sup>,
    Katherine Lambert<sup>7</sup>,
    Junmin Zhu<sup>4</sup>,
    Hao Wang<sup>3</sup>,
    Jienan Chen<sup>1,8</sup>,
    Yunze Xiao<sup>1,9</sup>,
    Minglai Yang<sup>1</sup>,
    Zihan Wang<sup>1</sup>,
    Hairong Yin<sup>10</sup>,
    Hao Wang<sup>11</sup>,
    Zhiwen Fan<sup>11</sup>,
    Tianneng Shi<sup>3</sup>,
    Zhun Wang<sup>3</sup>,
    Wenbo Guo<sup>4</sup>,
    Chenguang Wang<sup>2</sup>,
    Dawn Song<sup>3</sup>
</strong>
<br>
<sup>1</sup>2077AI Open Source Foundation, <sup>2</sup>UC Santa Cruz, <sup>3</sup>UC Berkeley, <sup>4</sup>UC Santa Barbara,
<sup>5</sup>University of Wisconsin–Madison, <sup>6</sup>MIT, <sup>7</sup>University of Toronto, <sup>8</sup>Johns Hopkins University,
<sup>9</sup>Carnegie Mellon University, <sup>10</sup>Purdue University, <sup>11</sup>Texas A&amp;M University
<br>
<em>*Equal contribution</em>
<br>
November 2026  |  Est. ~10-minute read  |  <a href="https://arxiv.org/pdf/2610.19005" target="_blank">Paper</a>  |  <a href="https://cyber-arena.ai" target="_blank">Project page</a>
</div>

## TL;DR

Most cybersecurity benchmarks test one agent in one role against a target that never changes, so they saturate as models improve. CyberArena instead has two AI agents attack each other's live service while patching their own, with every outcome verified by the arena. Across 466 games between 12 frontier agents, GPT-5.6 Sol and Claude Opus 5 lead the field, and challenges that agents solve alone become hard again once a defender fights back. Real-time pressure and a live adversary also expose both advanced capabilities, such as an attacker planting a backdoor that survives the defender's patch, and failures, such as agents claiming fixes they never tested.

## Key Takeaways

**A live opponent turns solved challenges back into hard ones.** GPT-5.6 Sol, Claude Opus 4.8 and GLM-5.3 all solve the same 30 of our 40 challenges when nobody defends the service, but once a second agent defends it, their average success rate falls from 89% in round 1 to 52% in round 2 and 42% in round 3. The presence of an adversary turns a verifiable task into a semi-open-ended setting and dynamically creates new tasks and settings that the evaluated agent has not seen.

**A single patch does not make a service safe.** After losing its flag (the secret that the attacker must steal) and deploying a patch, a defender still loses the flag again in 40% of the following rounds, and in 21% of games a patch leaves another route open. Although such shallow patches can pass the fixed checks of a static benchmark, a live attacker searches for that route.

**Under live pressure, agents try to earn credit without doing the intended task.** For example, instead of exploiting the opponent's service, attackers impersonated the arena itself by replaying its authorized requests, and defenders let the arena's health checker through while locking out the opponent. Our anti-cheat reviews and red-team games close most such routes before they are exploited, but we still found 6 of 1,336 accepted captures (0.45%) that came from shortcuts.

**Many agent errors come from their own work rather than from the opponent.** The most common error, in 23% of games, is claiming that a repair works when the agent's own tests do not show it, which means agents fail to judge how complete their own work is and make false reports of success. Agents also waste time by sleeping through active rounds (14% of games), even though their instructions forbid idling.

## What Is CyberArena?

CyberArena measures cybersecurity agents by making them compete, in the attack-and-defense format of human Capture-The-Flag (CTF) competitions. Each agent defends its own copy of a vulnerable service while attacking its opponent's copy. As a result, the opponent becomes the benchmark, because the difficulty an agent faces depends not only on the challenge but also on how well its opponent attacks and patches, and it keeps changing as both agents adapt.

<figure class="cyberarena-figure">
  <img src="images/teaser.png" alt="Top: jeopardy-style evaluation, where one agent plays a single role, attacking a static target or patching against fixed exploits, scored by capture rate or patch rate. Bottom: CyberArena, where two agents each host a live service with rotating flags, attack each other and patch their own service over three rounds, and round outcomes feed estimated attack, defense and availability scores." loading="lazy">
  <figcaption><em>Jeopardy-style benchmarks give an agent one role against a target that never changes. CyberArena gives both agents both roles at once, against a live opponent, and scores attack, defense and availability from the round outcomes.</em></figcaption>
</figure>

**Game setup.** Two agents play three 20-minute rounds in an isolated network, each hosting an identical copy of the same service. An agent scores by gaining unauthorized access to the opponent's service, for example by reading a flag, a secret canary value that changes every round, or by writing data or executing code where it should not be able to. Each agent must also patch its own service to block such access while keeping it working for benign users, and patches stay in place across rounds. The arena verifies every capture, and its health checker regularly acts as a benign user, for example by logging in or uploading a file, to confirm that each service still works.

**Ranking campaign.** Because agents face different opponents and challenges, our ranking model adjusts each result for both, places every agent's attack, defense and availability on one shared scale, and produces an expected score for each evaluated agent. To save cost, the arena picks the next games by how much they would reveal, and our campaign covers 466 games between 12 frontier agents on 40 challenges.

**Challenge sources.** Challenges come from past CTF finals, such as saarCTF, FAUST CTF and DEF CON CTF, and from real open-source applications, such as Jenkins and WordPress. Five of the real vulnerabilities, including ones in Openfire and GeoServer, are listed by the U.S. cybersecurity agency CISA as exploited in the wild. An automated pipeline of AI agents builds and reviews new challenges, so the pool can grow as new vulnerabilities are disclosed.

## Main Results

We evaluate 12 frontier agents from 10 developers on 40 challenges (14 from CTF finals and 26 from real applications), for a total of 466 games. Each game gives an agent a score from 0 to 100 that weighs attack (rounds in which it captured the opponent's flag), defense (rounds in which it kept its own flag) and availability (health checker tests its service passed) equally. Our ranking model predicts this score for every pairing and averages it over all opponents and challenges, so an expected score of 79% means 79 of 100 points against a typical opponent on a typical challenge.

<figure class="cyberarena-figure">
  <img src="images/leaderboard.png" alt="(a) Expected scores of 12 agents: GPT-5.6 Sol 78.6%, Claude Opus 5 73.8%, GLM-5.3 68.5%, down to HY4 Preview 56.3%. (b) Attack ability against defense ability, with GPT-5.6 Sol and Claude Opus 5 highest on defense." loading="lazy">
  <figcaption><em>Figure 1: (a) Expected scores of the 12 agents, fitted from 466 games and averaged over opponents and the 40 reference challenges, with 5–95% credible intervals. (b) Fitted attack ability against defense ability, relative to the field. The dashed line marks parity, and the defense axis skips 0.3–0.78, where no agent lies.</em></figcaption>
</figure>

### Leaderboard

**Two leaders.** GPT-5.6 Sol has the highest expected score at 79%, followed by Claude Opus 5 at 74% and GLM-5.3 at 69%, so the top scores step down in even gaps (Figure 1a). However, the two leaders stand apart when we count games won, since they win 83% and 86% of their games while no other agent wins more than 59%.

**Defense makes the difference.** Defense is what sets the leaders apart from the rest. Agents that attack well also tend to defend well (Figure 1b), but only the two leaders keep their flag in more than 80% of rounds, while no other agent does better than 61%. GPT-5.6 Sol is also the fastest to respond, deploying its first patch about two minutes into a game, earlier than any other agent.

### Inside the Fights

**Defenders respond.** Agents notice their opponent and respond within the same game. After losing its flag, a defender reviews the attacks that hit it in two-thirds of cases and deploys a patch before the next round in more than half. Defenders that patch keep their flag in the next round far more often than those that do not (60% against 9%), although this shows an association rather than proof that the patches worked.

**Attackers adapt.** Attackers respond in turn, and this exchange is what a static benchmark cannot capture. In Figure 2a, MiniMax M3 adds a missing permission check after losing its flag twice, and GPT-5.6 Sol's unchanged attack then fails. In Figure 2b, Claude Opus 4.8 blocks one route to its data, so HY4 Preview switches to another route and keeps stealing the flag until that route is closed too.

<figure class="cyberarena-figure">
  <img src="images/cases-adaptation.png" alt="Two game timelines over three rounds. (a) MiniMax M3 adds a missing permission check after losing its flag twice, and GPT-5.6 Sol's unchanged attack fails in round 3. (b) Claude Opus 4.8 blocks direct reads of its data, and HY4 Preview switches to the search feature and keeps capturing until search is blocked too." loading="lazy">
  <figcaption><em>Figure 2: Two audited games over three rounds, attacker on the upper line and defender on the lower. (a) MiniMax M3 adds a missing permission check after losing its flag twice, and GPT-5.6 Sol's unchanged attack then fails in round 3. (b) After Claude Opus 4.8 blocks direct reads of its data, HY4 Preview switches to the search feature and captures in rounds 2 and 3 until that route is closed too.</em></figcaption>
</figure>

## Emergent Behavior

We reviewed all 466 games with AI auditors that record each notable action together with the evidence behind it. Beyond attacking and patching, the audit shows agents planning ahead, repeating avoidable mistakes, and looking for ways around the rules.

### Advanced Behavior

**Opponent awareness.** In Figure 3c, Qwen3.8 Max closes an unprotected shell on its service, yet Grok 4.6 keeps stealing the flag. To find out how, Qwen3.8 Max writes its own packet sniffer, sees that the opponent is reusing a stolen login token, and replaces the token.

**Planning for later rounds.** Attackers also prepare for the rounds ahead. In Figure 3d, GPT-5.6 Sol plants a plugin in Gemini 3.5 Flash's server that survives the patch of the original entry point, captures through it in round 2, and plants a new one after the defender removes it. Such planted code keeps running after a patch in 4% of all games.

<figure class="cyberarena-figure">
  <img src="images/cases-advanced.png" alt="Two game timelines over three rounds. (c) Qwen3.8 Max closes an unprotected shell, runs a packet sniffer, and replaces a stolen login token used by Grok 4.6. (d) GPT-5.6 Sol plants a plugin in Gemini 3.5 Flash's server, captures through it after the entry is patched, and plants a new one after the plugin is removed." loading="lazy">
  <figcaption><em>Figure 3: Two more audited games. (c) After closing an unprotected shell, Qwen3.8 Max writes its own packet sniffer, finds Grok 4.6 reusing a stolen login token, and replaces the token. (d) GPT-5.6 Sol plants a plugin in Gemini 3.5 Flash's Openfire server. The plugin survives the patch of the entry route, and GPT-5.6 Sol captures through it in round 2.</em></figcaption>
</figure>

### Failures

**Unverified fixes.** The most common error is a fix that the agent declares successful without testing the version that is actually running (Table 1). In one game, an agent cited health checker results recorded before its patch went live as proof that the patch worked.

**Patches that miss or overreach.** Other patches are either incomplete or too strict. A partial patch closes one route while another stays open, whereas an over-blocking patch stops the attacker but also rejects legitimate users. For example, one agent added permission checks to its MLflow service that rejected normal user requests, and checking that the service still responded did not reveal the problem.

**Losing track of the game.** Agents also lose track of time and state. Some sleep through active rounds, especially the two Gemini agents, which idle in about a third of their games even though their instructions forbid it. Others attack the previous round's target after the flag has already changed.

<p style="text-align: center; font-size: 0.95rem; color: #555;"><em>Table 1: Agent-error patterns from the automated audit of all 466 games. Each percentage is the share of games with at least one finding in that category, and categories overlap.</em></p>

| Category | Recorded behavior | Games |
|---|---|---:|
| Unverified fix claim | A claim of repair success exceeds what the recorded tests establish. | 23% |
| Partial patch | A guard leaves another observed route to the capability open. | 21% |
| Sleeps through rounds | The agent spends active round time in deliberate sleeps. | 14% |
| Fix left undeployed | The agent defers deploying an identified defensive repair. | 9% |
| Over-blocking patch | Authorization repairs reject legitimate application workflows. | 8% |
| Stale round state | The agent reuses an earlier target or proof after the flag rotates. | 8% |
| Persistent attacker code | Attacker-installed code remains executable after a patch is deployed. | 4% |

### Cheating

**Shortcut attempts.** Under live pressure, attackers often probed for ways around the intended flaw. The most common attempt, logging in directly to the opponent's server, appeared in 30% of games, but none is recorded as succeeding. A few attempts did pay off, since six accepted captures came from replaying the arena's own authorized requests or reading the arena's private records of the opponent's flags.

**Fooling the health checker.** Defenders bent the rules as well. In one game, a defender changed the opponent's login password and then let requests from the address it linked to the health checker skip the password check, so the health checker kept passing the service while the opponent could no longer log in. Passing the health checker therefore does not always mean that a service is truly available.

**Red-teaming the arena.** An attacker may only score through a flaw in the challenge's application, so any other route to the flag is a defect of the arena itself. To find such defects, three frontier agents play on a dummy service with no flaw at all and are told to get the flag by any means, so every accepted capture points to an arena bug. These games exposed a leak in the arena's spectator panel, which we closed, and a check of all ranking games found no use of it.

**Red-teaming the challenges.** Each challenge also defines what is allowed on both sides. A valid attack must reach the flag through a real flaw in the application, using only the access given to the attacker, and a valid defense must block that attack while keeping every normal feature working. Before a challenge enters the pool, an AI reviewer tries to break these rules, for example by searching for a shortcut to the flag or for a defense that passes the health checker while refusing legitimate users, and it must prove each problem it reports by actually running the attack.

## Round Dynamics

**Solo play saturates.** To see what a live opponent changes, we first let GPT-5.6 Sol, Claude Opus 4.8 and GLM-5.3 attack each challenge alone, with no defender and two attempts per challenge. All three solve the same 30 of the 40 challenges, so on these challenges solo play cannot tell them apart (Figure 4a).

**A defender brings the difference back.** On the same 30 challenges in contested games, the attackers' average success rate falls from 89% in round 1 to 42% in round 3, which is consistent with defenders patching between rounds. The drop also differs by model, since GPT-5.6 Sol still succeeds in about half of its round-3 attacks while Claude Opus 4.8 and GLM-5.3 fall to about a third (Figure 4b).

**An example.** In one game on RCEaaS Shell Jail, a challenge that Claude Opus 4.8 had solved alone, GPT-5.6 Sol patched a path-traversal flaw, which let users escape the folder they were confined to, within about a minute of round 1. Claude Opus 4.8 then tried its solo exploit and found that it failed against the patched service but still worked on its own unpatched copy. From this comparison, it concluded in its messages that the opponent had patched the flaw.

**Why it matters.** In a static benchmark, a task once solved stays solved, but the same task becomes harder in the presence of a live adversary. A live opponent may therefore keep existing challenges useful as models improve, instead of forcing benchmark authors to retire them and write new ones.

<figure class="cyberarena-figure">
  <img src="images/round-dynamics.png" class="cyberarena-narrow" alt="(a) Solo capture rates on all 40 challenges: GPT-5.6 Sol 95%, Claude Opus 4.8 78%, GLM-5.3 78%. (b) On the 30 challenges all three solve alone, capture rates fall from 100% solo to 52%, 37% and 35% by contest round 3." loading="lazy">
  <figcaption><em>Figure 4: Solo and contest capture rates for GPT-5.6 Sol, Claude Opus 4.8 and GLM-5.3. (a) Solo, on all 40 challenges, counting a capture in either of two single-round attempts. (b) On the 30 challenges all three solve alone: the solo rate against each contest round, with 95% bootstrap intervals.</em></figcaption>
</figure>

## Why This Matters

**Real-world security is a moving contest.** Keeping a system secure is not a one-time fix, because attackers adapt to every repair and defenders must keep track of what is happening on their systems. In practice, security engineers probe their own services through penetration testing, read the traces that attackers leave behind, triage and investigate incidents, and patch live systems under time pressure. A static benchmark captures none of this, since its target never changes and nobody is on the other side. CyberArena brings this loop into evaluation, so an agent is rewarded for noticing its opponent, as when Qwen3.8 Max built a packet sniffer, and for repairing its service without breaking it.

**Verifiable environments that do not saturate.** Building and evaluating powerful agents requires environments that check outcomes automatically, yet such environments lose their value once agents solve them. Competition offers a way out, because each side's progress poses a harder problem for the other, and self-play methods such as [GPT-Red](https://arxiv.org/abs/2607.26115) already use this idea to train a prompt-injection attacker against defenders that are trained at the same time. CyberArena applies the same principle to cybersecurity with verified outcomes, and its game records could help train attackers and defenders against each other, a loop we call Recursive Adversarial Improvement.
