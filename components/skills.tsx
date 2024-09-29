import React from 'react'
import SectionHeading from './section-Header'
import { skillsData } from '@/lib/data'

export default function Skills() {
    return (
        <section className='mb-28 max-w-[58rem] scroll-my-28 text-center sm:mb-40'>
            <SectionHeading>
                My Skills
            </SectionHeading>
            <ul className=' flex flex-wrap justify-center gap-2 text-lg text-gray-800'>
                {skillsData.map((skill, index) => (
                    <li key={index} className='bg-white border-black/[0.1]'>
                        {skill}
                    </li>
                ))}
            </ul>
        </section>
    )
}
