import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const paragraphVariants = cva("leading-7 [&:not(:first-child)]:mt-0", {
  variants: {
    variant: {
      default: "",
      lead: "text-xl text-muted-foreground",
      muted: "text-sm text-muted-foreground",
      child: "[&:not(:first-child)]:mt-6",
    },
    size: {
      default: "",
      small: "text-sm font-medium leading-none",
      large: "text-lg font-semibold",
      medium: "text-base",
    },
    weight: {
      default: "",
      bold: "font-bold",
      medium: "font-medium",
      light: "font-light",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
    weight: "default",
  },
});

// Extend with native attributes
interface ParagraphProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof paragraphVariants> {}

const P = ({ className, variant, size, weight, ...props }: ParagraphProps) => {
  return (
    <p
      className={cn(paragraphVariants({ weight, variant, size, className }))}
      {...props}
    />
  );
};

export { P, paragraphVariants };
