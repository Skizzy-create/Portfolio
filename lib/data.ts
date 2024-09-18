import React from "react";
import { CgWorkAlt } from "react-icons/cg";
import { FaReact } from "react-icons/fa";
import { LuGraduationCap } from "react-icons/lu";
import BHospitalDark from "@/public/BHospital-Dark.png";
import Rentry from "@/public/Rentry.png"
import paytmSingup from "@/public/Paytm_singup.png";
import groundT5 from "@/public/groundT-(-5).png"
import groundT2 from "@/public/groundT-2.png"
import positionEstimate from "@/public/PositionEstimator.png"
import BHospitalLight from '@/public/BhospitalLight.png'
import cropComment from "@/public/corpcomment.png";
import rmtDev from '@/public/rmtdev.png';
import wordAnalytics from '@/public/wordanalytics.png';

export const links = [
    {
        name: "Home",
        hash: "#home",
    },
    {
        name: "About",
        hash: "#about",
    },
    {
        name: "Projects",
        hash: "#projects",
    },
    {
        name: "Skills",
        hash: "#skills",
    },
    {
        name: "Experience",
        hash: "#experience",
    },
    {
        name: "Contact",
        hash: "#contact",
    },
] as const;

export const experiencesData = [
    {
        title: "Graduated bootcamp",
        location: "Miami, FL",
        description:
            "I graduated after 6 months of studying. I immediately found a job as a front-end developer.",
        icon: React.createElement(LuGraduationCap),
        date: "2019",
    },
    {
        title: "Front-End Developer",
        location: "Orlando, FL",
        description:
            "I worked as a front-end developer for 2 years in 1 job and 1 year in another job. I also upskilled to the full stack.",
        icon: React.createElement(CgWorkAlt),
        date: "2019 - 2021",
    },
    {
        title: "Full-Stack Developer",
        location: "Houston, TX",
        description:
            "I'm now a full-stack developer working as a freelancer. My stack includes React, Next.js, TypeScript, Tailwind, Prisma and MongoDB. I'm open to full-time opportunities.",
        icon: React.createElement(FaReact),
        date: "2021 - present",
    },
] as const;

export const projectsData = [
    {
        title: "Paytm Clone - Full-Stack Application",
        description:
            "Features user sign-up, log-in, balance checks, fund transfers, and transaction views. Utilizes React for the frontend and Express.js for the backend.",
        tags: ["React", "Node", "MongoDB", "Tailwind", "Express.js", "JWT Authentication"],
        imageUrl: paytmSingup,
    },
    {
        title: "MyEncrypt - Full-Stack Encryption App",
        description:
            "Offers encryption, decryption, JWT handling, and QR code generation, built with Express.js and TypeScript.",
        tags: ["Express.js", "Mongoose", "JWT", "BcryptJS", "Crypto", "QR Code", "TypeScript"],
        imageUrl: rmtDev,
    },
    {
        title: "Fashion Image Generation Using GAN",
        description:
            "Generates fashion images using a GAN trained on the Fashion MNIST dataset, emphasizing high accuracy rates.",
        tags: ["GAN", "TensorFlow", "Python", "Deep Learning"],
        imageUrl: cropComment,
    },
    {
        title: "Hybrid Model Architecture for Position Estimation",
        description:
            "Combines Dense and LSTM layers for 3D position prediction, optimized for rapid computation with GPU support.",
        tags: ["Deep Learning", "RNN", "LSTM", "Python"],
        imageUrl: Rentry,
    },
    {
        title: "Satellite Image Processing for Road Extraction",
        description:
            "Employs a U-Net model to extract roads from satellite images, optimized for clarity and speed with TensorFlow and OpenCV.",
        tags: ["CNN", "U-Net", "OpenCV", "TensorFlow"],
        imageUrl: BHospitalDark,
    }
] as const;



export const skillsData = [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Git",
    "Tailwind",
    "Prisma",
    "MongoDB",
    "Redux",
    "GraphQL",
    "Apollo",
    "Express",
    "PostgreSQL",
    "Python",
    "Django",
    "Framer Motion",
] as const;