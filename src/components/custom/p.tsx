import { cva, VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const paragraphVariants = cva("leading-7 [&:not(:first-child)]:mt-0", {
  variants: {
    variant: {
      default: "",
      lead: "text-muted-foreground text-xl",
      muted: "text-muted-foreground text-sm",
      child: "[&:not(:first-child)]:mt-6",
      error: "text-sm font-semibold text-red-500 dark:text-red-400",
    },
    size: {
      default: "",
      small: "text-sm leading-none font-medium",
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
})

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
  )
}

export { P, paragraphVariants }
