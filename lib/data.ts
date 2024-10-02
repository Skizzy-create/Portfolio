import React from "react";
import { CgWorkAlt } from "react-icons/cg";
import { FaBrain, FaImages, FaLock, FaReact, FaSatellite } from "react-icons/fa";
import { LuGraduationCap } from "react-icons/lu";
import BHospitalDark from "@/public/BHospital-Dark.png";
import Rentry from "@/public/Rentry.png"
import paytmSingup from "@/public/Paytm_singup.png";
import cropComment from "@/public/corpcomment.png";
import rmtDev from '@/public/rmtdev.png';
import wordAnalytics from '@/public/wordanalytics.png';
import MainPage from '@/public/mainpage.png';
import LandingPage from '@/public/LandingPage.png';
import { BsGraphUp } from "react-icons/bs";

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
        title: "Machine Learning Engineer - Intern",
        location: "Remote, United Kingdom",
        description:
            "Enhanced itinerary creation in a Travel Guide by fine-tuning a Large Language Model (LLM) using Retrieval-Augmented Generation (RAG) and Self-RAG. Increased search context by 47% with an LLM internet connection pipeline and improved cost tracking by 30% with a token cost logger feature.",
        icon: React.createElement(FaBrain),
        date: "Aug 2023 - Jan 2024",
    },
    {
        title: "Fashion Image Generation Using GAN",
        location: "Mohali, Punjab",
        description:
            "Developed a GAN model to generate fashion images using the Fashion MNIST dataset. Reduced training time from 3.6 days to 33 hours through GPU acceleration, achieving a generator accuracy of 98.7%.",
        icon: React.createElement(FaImages),
        date: "Jun 2024 - Jul 2024",
    },
    {
        title: "Hybrid Model for Position Estimation",
        location: "Mohali, Punjab",
        description:
            "Created a hybrid ANN and RNN model for 3D position prediction of ballistic projectiles, achieving an accuracy of 99.6%. Integrated GPU support to reduce computation time by 92%.",
        icon: React.createElement(BsGraphUp),
        date: "Feb 2024 - Mar 2024",
    },
    {
        title: "Satellite Image Processing for Road Extraction",
        location: "Mohali, Punjab",
        description:
            "Developed a U-Net model for road extraction from satellite images with 99.4% accuracy. Leveraged TensorFlow and OpenCV to reduce training time by 93%.",
        icon: React.createElement(FaSatellite),
        date: "Sep 2023 - Oct 2023",
    },
    {
        title: "MyEncrypt - Full-Stack Encryption App",
        location: "Gurugram, India",
        description:
            "Developed a full-stack encryption app allowing users to securely encrypt and decrypt messages, and generate QR codes for easy sharing. Built with Express.js, TypeScript, BcryptJS, Crypto, and Mongoose.",
        icon: React.createElement(FaLock),
        date: "2024",
    },
] as const;


export const projectsData = [
    {
        title: "Paytm Clone - Full-Stack Application",
        description:
            "Features user sign-up, log-in, balance checks, fund transfers, and transaction views. Utilizes React for the frontend and Express.js for the backend.",
        tags: ["React", "Node", "MongoDB", "Tailwind", "Express.js", "JWT Authentication"],
        imageUrl: paytmSingup,
    }, {
        title: "Fashion Image Generation Using GAN",
        description:
            "Generates fashion images using a GAN trained on the Fashion MNIST dataset, emphasizing high accuracy rates.",
        tags: ["GAN", "TensorFlow", "Python", "Deep Learning"],
        imageUrl: rmtDev,
    },
    {
        title: "MyEncrypt - Full-Stack Encryption App",
        description:
            "MyEncrypt offers a simple, secure way to encrypt and decrypt messages.Enter your message, and get the encrypted result. You can also generate a QR code for easy sharing and direct decryption within the app.",
        tags: ["Express.js", "TypeScript", "BcryptJS", "Crypto", "Mongoose"],
        imageUrl: LandingPage,
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
    "Node.js",
    "Git",
    "Tailwind",
    "Prisma",
    "MongoDB",
    "Redux",
    "Express",
    "Framer Motion",
    "PostgreSQL",
    "CloudFlare",
    "Hono",
    "Python",
    "Fast-API",
    "GPU-Acceleration",
    "Machine Learning",
    "DeepLearning",
    "TensorFlow",
    "Pytorch",
    "Large Language Models",
    "Transformers",
    "LangChain",
    "Data Analytics",
    "CryptoGraphy",
    "Public Speaking",
    "Flutter"
] as const;