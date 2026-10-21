"use client";

import { useEffect, useRef } from "react";

// A fixed WebGL sky that follows the whole page: aurora-lit night at the top,
// deep forest through the middle, and dawn by the time you reach Contact.
// `--progress` (0..1 scroll) drives the day cycle.

const vert = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const frag = `
precision highp float;
uniform vec2 r;uniform float t;uniform vec2 m;uniform float p;
float h(vec2 x){return fract(sin(dot(x,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 x){vec2 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 x){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(x);x=x*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r;
  vec2 q=(gl_FragCoord.xy-.5*r)/r.y;
  float dawn=smoothstep(.78,1.,p);
  float deep=smoothstep(.25,.6,p)*(1.-dawn);

  vec3 nightTop=vec3(.006,.03,.028),nightBot=vec3(.018,.075,.058);
  vec3 dawnTop=vec3(.07,.06,.14),dawnBot=vec3(.98,.58,.34);
  vec3 col=mix(mix(nightBot,nightTop,uv.y),mix(dawnBot,dawnTop,pow(uv.y,.55)),dawn);
  col=mix(col,vec3(.01,.045,.035),deep*.55);

  // aurora curtains
  float a=0.;
  for(int i=0;i<4;i++){
    float fi=float(i);
    float x=q.x*(1.1+fi*.35)+t*.008*(fi+1.)+m.x*.06;
    float y=.22+fi*.08+fbm(vec2(x*1.4,t*.015+fi*3.1))*.34-m.y*.04;
    float band=exp(-pow((q.y-y)*(5.5+fi),2.));
    float tail=smoothstep(y-.35,y,q.y)*exp(-(q.y-y)*2.)*.35;
    float streak=.55+.45*n(vec2(q.x*38.+fi*13.,t*.08));
    a+=(band+tail)*streak*(1.-fi*.17);
  }
  vec3 ac=mix(vec3(.28,1.,.74),vec3(.64,.56,1.),smoothstep(-.5,.7,q.x+sin(t*.07)*.35));
  col+=ac*a*.085*smoothstep(-.1,.45,q.y)*(1.-smoothstep(.15,.5,p));

  // stars
  vec2 sc=q*170.;vec2 id=floor(sc);float hs=h(id);
  float s=step(.993,hs)*smoothstep(.45,0.,length(fract(sc)-.5))*(.55+.25*sin(t*.6+hs*90.))*.6;
  col+=s*vec3(.88,1.,.95)*(1.-dawn)*smoothstep(-.25,.35,q.y);

  // ground fog
  float fog=fbm(vec2(q.x*1.8+t*.025,q.y*3.2-t*.01));
  col+=mix(vec3(.08,.28,.2),vec3(1.,.7,.5),dawn)*fog*smoothstep(.15,-.6,q.y)*.18;

  // dawn sun
  col+=vec3(1.,.62,.32)*dawn*exp(-length(q-vec2(.28,-.42))*2.3)*.9;

  // vignette
  col*=1.-.55*pow(length(uv-.5)*1.25,2.2);
  gl_FragColor=vec4(col,1.);
}`;

export default function Sky() {
  const glRef = useRef<HTMLCanvasElement>(null);
  const flyRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = glRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    const uM = gl.getUniformLocation(prog, "m");
    const uP = gl.getUniformLocation(prog, "p");

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scale = 0.5; // render at half-res; the sky is soft anyway
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let progress = 0;
    let raf = 0;

    const resize = () => {
      canvas.width = Math.floor(innerWidth * scale);
      canvas.height = Math.floor(innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / innerWidth - 0.5;
      mouse.ty = e.clientY / innerHeight - 0.5;
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress = max > 0 ? scrollY / max : 0;
    };

    // fireflies
    const fc = flyRef.current!;
    const ctx = fc.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio, 1.5);
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const sg = sprite.getContext("2d")!;
    const grad = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(220,255,200,1)");
    grad.addColorStop(0.15, "rgba(170,255,190,0.85)");
    grad.addColorStop(0.45, "rgba(124,245,200,0.18)");
    grad.addColorStop(1, "rgba(124,245,200,0)");
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 64, 64);
    const flies = Array.from({ length: innerWidth < 700 ? 8 : 18 }, () => ({
      x: Math.random(), y: Math.random(), s: 4 + Math.random() * 8,
      ph: Math.random() * Math.PI * 2, sp: 0.2 + Math.random() * 0.6,
    }));
    const resizeFlies = () => {
      fc.width = innerWidth * dpr;
      fc.height = innerHeight * dpr;
    };

    let lastScroll = scrollY;
    const frame = (ms: number) => {
      const t = ms / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, t);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.uniform1f(uP, progress);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const dy = (scrollY - lastScroll) / innerHeight;
      lastScroll = scrollY;
      ctx.clearRect(0, 0, fc.width, fc.height);
      ctx.globalCompositeOperation = "lighter";
      const fade = 1 - Math.max(0, (progress - 0.85) / 0.15) * 0.8;
      for (const f of flies) {
        f.ph += 0.01 * f.sp;
        f.x += Math.cos(f.ph * 1.3) * 0.0006 * f.sp + mouse.x * 0.0002;
        f.y += Math.sin(f.ph) * 0.0005 * f.sp - dy * 0.15 * (f.s / 20);
        if (f.x < -0.05) f.x = 1.05; if (f.x > 1.05) f.x = -0.05;
        if (f.y < -0.05) f.y = 1.05; if (f.y > 1.05) f.y = -0.05;
        const blink = 0.12 + 0.33 * Math.max(0, Math.sin(t * f.sp * 2 + f.ph * 3));
        ctx.globalAlpha = blink * fade;
        const size = f.s * dpr * 2;
        ctx.drawImage(sprite, f.x * fc.width - size / 2, f.y * fc.height - size / 2, size, size);
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    resize();
    resizeFlies();
    onScroll();
    addEventListener("resize", resize);
    addEventListener("resize", resizeFlies);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("resize", resizeFlies);
      removeEventListener("pointermove", onMove);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={glRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={flyRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
