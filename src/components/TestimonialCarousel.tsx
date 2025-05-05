
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  organization?: string;
  image?: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  className?: string;
}

const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({
  testimonials,
  className,
}) => {
  const [api, setApi] = React.useState<{ scrollNext: () => void } | null>(null);

  // Auto-scroll effect for the carousel
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className={cn("w-full", className)}>
      <Carousel
        setApi={setApi}
        className="mx-auto w-full max-w-5xl"
        opts={{
          align: "center",
          loop: true,
        }}
      >
        <CarouselContent>
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index} className="md:basis-2/3 lg:basis-1/2 pl-4">
              <div className="p-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
                >
                  {/* Notched corner styling */}
                  <div className="absolute -top-px -right-px h-4 w-4 bg-gray-50"></div>
                  <div className="absolute -top-px -right-px h-8 w-1 bg-white"></div>
                  <div className="absolute -top-px -right-px w-8 h-1 bg-white"></div>
                  
                  {/* Quote content */}
                  <div className="mb-4">
                    <svg
                      className="h-6 w-6 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.51.884-3.995 2.757-3.995 5.149h2v10.7h-7.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.511.884-3.996 2.757-3.996 5.149h2v10.7h-8z" />
                    </svg>
                  </div>
                  
                  <p className="mb-4 text-gray-700">{testimonial.quote}</p>
                  
                  <div className="mt-auto flex items-center">
                    {testimonial.image && (
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="mr-4 h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                        {testimonial.organization && (
                          <>, {testimonial.organization}</>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Draggable handle indicator */}
                  <div className="absolute bottom-4 right-4">
                    <div className="flex gap-1">
                      <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                      <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                      <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-8 flex justify-center">
          <CarouselPrevious className="relative inset-0 translate-y-0 rounded-full" />
          <CarouselNext className="relative inset-0 translate-y-0 rounded-full ml-4" />
        </div>
      </Carousel>
    </div>
  );
};

export default TestimonialCarousel;
