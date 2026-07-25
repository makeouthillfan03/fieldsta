import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

// Ported from Aceternity UI's ContainerScroll for this Vite + JS project:
// no Next.js (next/image → plain <img>), no TypeScript types, and a
// prefers-reduced-motion fallback added (the upstream version always
// scroll-links the tilt/scale, which the UX guidelines here flag as a
// motion-sensitivity risk).
export const ContainerScroll = ({ titleComponent, children }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const handler = (e) => setReducedMotion(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  const scaleDimensions = () => (isMobile ? [0.7, 0.9] : [1.05, 1]);

  const rotate = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reducedMotion ? [1, 1] : scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, -100]);

  return (
    <div
      className="relative flex h-[50rem] items-center justify-center p-2 md:h-[70rem] md:p-20"
      ref={containerRef}
    >
      <div className="relative w-full py-10 md:py-40" style={{ perspective: "1000px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }) => (
  <motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
    {titleComponent}
  </motion.div>
);

export const Card = ({ rotate, scale, children }) => (
  <motion.div
    style={{
      rotateX: rotate,
      scale,
      boxShadow:
        "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
    }}
    className="mx-auto -mt-12 h-[24rem] w-full max-w-5xl rounded-[30px] border-4 border-[#F5F5F5]/15 bg-[#0d0d0e] p-2 shadow-2xl md:h-[32rem] md:p-6"
  >
    <div className="h-full w-full overflow-hidden rounded-2xl bg-[#060607]">{children}</div>
  </motion.div>
);
