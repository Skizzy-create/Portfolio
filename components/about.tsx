'use client'

import React from 'react'
import SectionHeader from './section-Header'
import { motion } from 'framer-motion'
import { useSectionInView } from '@/lib/hooks'

export default function About() {
    const { ref } = useSectionInView("About", 0.55);

    return (
        <motion.section
            ref={ref}
            className='mb-28 text-center max-w-[45rem] leading-8 sm:mb-40 scroll-mt-28'
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: 0.175,
            }}
            id='about'
        >
            <SectionHeader>About me</SectionHeader>
            <div className="mb-3 sm:mx-2 mx-6 sm:text-center text-justify">
                <p>
                    By day, I’m a Machine Learning Engineer, conquering challenges at the intersection of AI and backend development, pursuing a Bachelor’s of Engineering at <span className="font-medium">Chandigarh University</span>. By night, I’m constantly innovating, whether it’s fine-tuning <span className="font-medium">Large Language Models (LLMs)</span> using <span className="font-medium">RAG and Self-RAG</span> or crafting powerful applications with the <span className="font-medium">MERN stack</span>.
                    <br />
                    My adventures include building <span className="italic">GANs for fashion image generation</span> and designing hybrid models for <span className="font-medium">3D position estimation</span>. From working on satellite image processing to leading development teams, I’ve been fortunate to push the boundaries of <span className="underline">AI-driven innovation</span>. I thrive in projects where I can bring creativity and cutting-edge technology together.
                    <br />
                    My core skills include <span className="font-medium">Machine Learning, Deep Learning, Transformers, and Backend Development</span>, but my true passion lies in solving real-world problems and optimizing processes to be faster and smarter. Whether it's reducing training time by 93% on a U-Net model or enhancing productivity by 25% as a team lead, <br />I’m always up for a challenge.
                </p>

                <p>
                    <span className="italic">When I’m not coding</span>, you can find me diving deep into the world of <span className="font-medium">AI and Aerospace technologies</span>, keeping up with the latest trends, or simply enjoying a good sci-fi movie. <span className="font-medium">Learning never stops</span> for me—I’m always exploring new fields, from satellite image processing to industry trends in AI. Let's connect and build something groundbreaking together!
                </p>
            </div>
        </motion.section>
    )
}
