
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface VideoDemoProps {
  videoUrl: string;
  thumbnailUrl: string;
  title?: string;
  description?: string;
  className?: string;
}

const VideoDemo: React.FC<VideoDemoProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  description,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className={cn("w-full max-w-5xl mx-auto", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-xl bg-black/5 backdrop-blur-sm border border-white/20 shadow-xl"
      >
        {title && (
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-black/30 backdrop-blur-md">
            <h3 className="text-xl font-medium text-white">{title}</h3>
            {description && <p className="text-white/80 text-sm">{description}</p>}
          </div>
        )}

        <div className="relative aspect-video w-full">
          {!isPlaying ? (
            <>
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 backdrop-filter backdrop-blur-sm flex items-center justify-center">
                <Button
                  onClick={handlePlay}
                  size="lg"
                  className="h-16 w-16 rounded-full bg-white/90 hover:bg-white text-teal-600 hover:text-teal-700 hover:scale-105 transition-all"
                >
                  <Play className="h-6 w-6 fill-current" />
                  <span className="sr-only">Play video</span>
                </Button>
              </div>
            </>
          ) : (
            <iframe
              src={`${videoUrl}?autoplay=1`}
              title="Video player"
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VideoDemo;
