"use client";

import React from "react";

import { experiencesData } from "@/lib/data";
import { useSectionInView } from "@/lib/hooks";
import SectionHeading from "./section-Header";
import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import 'react-vertical-timeline-component/style.min.css';

export default function Experience() {
  console.log(experiencesData)
  return (
    <section id="experience" >
      <SectionHeading>My experience</SectionHeading>
      <VerticalTimeline >
        {
          experiencesData.map((item, index) => (
            <React.Fragment key={index}>
              <VerticalTimelineElement>
                <h3>{item.title}</h3>
                <p>{item.location}</p>
                <p>{item.description}</p>
              </VerticalTimelineElement>
            </React.Fragment>
          ))}
      </VerticalTimeline>
    </section>
  );
}