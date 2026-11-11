---
# One research project. PROJECT-TEMPLATE.md lists the fields that a team must send.
# Images go in assets/img/ (file name only).
title: Human-AI teams in agile effort estimation
date: 2025-11-01            # sorts the Research page, newest first
tags: [Agile teams, Effort estimation]
# Description: 3 sentences maximum.
description: We build a platform where hybrid teams of human developers and AI agents meet online, discuss each user story and agree on the effort, in the same way as Planning Poker. Each agent takes a team role, such as front-end or back-end developer, explains its estimate and points to similar past stories.
cover: seeagent-platform.jpg
video: https://youtu.be/0jrmOUjQbi8
video_length: "3:07"        # the target is 2:00 maximum
# Result metrics highlights. Source: arXiv 2509.14483, human study, Section III-B and Fig. 4 (12 participants)
metrics:
- value: 100%
  label: said the agents would benefit agile teams
- value: 83%
  label: said working with the agents felt natural
- value: 67%
  label: said the agents helped the team reach consensus efficiently
metrics_note: Survey of software practitioners after a live estimation session with the agents.
# Team: link is the page under the name (homepage or LinkedIn). Leave photo empty for a placeholder.
team:
- name: Thanh-Long Bui
  role: PhD researcher
  photo: ""
  link: ""                  # TODO: LinkedIn URL
- name: Hoa Khanh Dam
  role: Professor
  photo: hoa.png
  link: https://documents.uow.edu.au/~hoa/
  link_label: Homepage
# partners: [{name: ..., logo: ...}]   shown to the right of the team; leave out when there are none
# Testimonial is optional.
testimonial:
  text: It can help the team not only estimate the user stories correctly but also see the related issues arising when implementing these sorts of features in the past.
  by: Participant, practitioner study
papers:
- title: An LLM-based multi-agent framework for agile effort estimation
  venue: ASE 2025 (A*)
  authors: [Thanh-Long Bui, Hoa Khanh Dam, Rashina Hoda]
  links:
  - label: IEEE Xplore
    url: https://ieeexplore.ieee.org/document/11334617/
  - label: arXiv
    url: https://arxiv.org/abs/2509.14483
---
