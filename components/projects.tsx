'use client'

import React, { useEffect, useRef } from 'react'
import SectionHeader from './section-Header'
import { projectsData } from '@/lib/data'
import Project from './project'
import { useActiveSectionContext } from '@/context/active-section-context'
import { useInView } from 'react-intersection-observer'
import { useSectionInView } from '@/lib/hooks'

export default function About() {
    const { ref } = useSectionInView("Projects", 0.15);
    // const { setActiveSection, timeOfLastClick } = useActiveSectionContext();
    // const { ref, inView } = useInView({
    //     threshold: 0.2
    // });

    // useEffect(() => {
    //     if (inView && Date.now() - timeOfLastClick > 1000) {
    //         setActiveSection('Projects');
    //     }
    // }, [inView, setActiveSection, timeOfLastClick]);
    return (
        <section ref={ref} id='projects' className='scroll-mt-28 mb-28'>
            <SectionHeader>My projects</SectionHeader>
            <div className='sm:mx-2 mx-6'>
                {projectsData.map((project, index) => (
                    <React.Fragment key={index}>
                        <Project {...project} />
                    </React.Fragment>
                ))}
            </div>
        </section>
    )
};

