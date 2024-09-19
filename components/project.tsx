'use client'

import { projectsData } from "@/lib/data";
import { useScroll } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { motion } from "framer-motion";

type ProjectProps = (typeof projectsData)[number]

function Project({
    title,
    description,
    tags,
    imageUrl
}: ProjectProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["0 1", "1.33 1"]
    });

    return <motion.div
        ref={ref}
        className="group"
        style={{
            scale: scrollYProgress,
            opacity: scrollYProgress,
        }}>
        <section className="group bg-gray-100 max-w-[42rem] border border-black/5 rounded-lg overflow-hidden sm:pr-8 relative mb-3 sm:mb-8 lst:mb-0 sm:h-[24rem] hover:bg-gray-200 transition">
            <div className="pt-4 pb-7 px-5 sm:pl-10 sm:pr-2 sm:pt-10 sm:max-w-[50%] flex flex-col h-full sm:group-even:ml-[20rem]">
                <h3 className="text-2xl font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-gray-700">{description}</p>
                <ul className="flex flex-wrap mt-4 gap-2 sm:mt-auto">
                    {tags.map((tag, index) => (
                        <li
                            className="bg-black/[0.7] px-3 py-1 text-[0.7rem] uppercase tracking-wider text-white rounded-full hover:bg-black/[1.2] transition hover:scale-110"
                            key={index}
                        >
                            {tag}
                        </li>
                    ))}
                </ul>
            </div>
            <Image
                className="rounded-t-lg shadow-2xl absolute top-8 -right-40 w-[28.25rem] 
                group-even:right-[initial] 
                group-even:-left-40 
                
                group-hover:scale-[1.04] 
                group-hover:-translate-x-3 
                group-hover:translate-y-3 
                group-hover:-rotate-2 
                
                group-even:group-hover:translate-x-3 
                group-even:group-hover:translate-y-3 
                group-even:group-hover:rotate-2 
                transition"
                src={imageUrl}
                alt="project image"
                quality={95}
            />
        </section>
    </motion.div>

}

export default Project;