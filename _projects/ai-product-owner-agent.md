---
# One research project. PROJECT-TEMPLATE.md lists the fields that a team must send.
# Images go in assets/img/ (file name only). Videos go in assets/video/ (file name only).
title: "AI Product Owner agent: from interviews to user stories"
date: 2026-11-01            # sorts the Research page, newest first
tags: [Requirements engineering, Conversational agents]
# Description: 3 sentences maximum.
description: Our AI Product Owner agent joins an online meeting such as Zoom, Google Meet or Microsoft Teams and interviews a stakeholder by voice. It follows each usage scenario and asks follow-up questions until it knows what the stakeholder wants and why, then it writes user stories from the conversation. In a test on 31 datasets, it had the highest precision and F1 score of seven methods.
cover: po-agent-cover.jpg
video: ai-po-agent.mp4
video_length: "2:25"
# Result metrics highlights. Source: manuscript (not published), Study 2, Sections 3.2.2 and 3.2.3
# (10 participants; member checking of 60 user stories: 50 accurate = 83.3%; Q7 = 100% agree; Q1 = 90% agree)
metrics:
- value: 83%
  label: of the user stories were rated by participants as an accurate record of their needs
- value: 100%
  label: felt comfortable telling the agent their thoughts and ideas
- value: 90%
  label: said the agent helped them express their needs
metrics_note: Participants had a voice interview with the agent, then rated the interview and the user stories that it wrote.
# Team: link is the page under the name (homepage or LinkedIn). Leave photo empty for a placeholder.
team:
- name: Hirofumi Tanahashi
  role: ""                  # TODO: role
  photo: ""
  link: ""                  # TODO: LinkedIn URL
- name: Hoa Khanh Dam
  role: Professor
  photo: hoa.png
  link: https://documents.uow.edu.au/~hoa/
  link_label: Homepage
- name: Thanh-Long Bui
  role: PhD researcher
  photo: ""
  link: ""                  # TODO: LinkedIn URL
# Testimonial is optional. Source: manuscript, Section 3.2.2 (answer to Q12)
testimonial:
  text: Good at staying within the topic and building more questions based on my answers.
  by: Participant, user study
papers:
- title: "From Interviews to User Stories: A Structured Voice-Based Agent for Requirements Elicitation"
  venue: Under review
  authors: [Hirofumi Tanahashi, Hoa Khanh Dam, Thanh-Long Bui]
---
