import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "text-white shadow-md hover:shadow-lg btn-hover-glow water-shine",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:bg-destructive/90 hover:scale-[1.02]",
        outline:
          "border-2 border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.02]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:bg-secondary/80 hover:scale-[1.02] border border-border",
        ghost:
          "hover:bg-secondary hover:text-secondary-foreground hover:scale-[1.02] dark:hover:bg-secondary/80 dark:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline font-medium dark:text-primary-light",
      },
      size: {
        default: "h-11 px-7 py-2.5 has-[>svg]:px-5 text-[15px]",
        sm: "h-9 px-5 has-[>svg]:px-4 text-[13px]",
        lg: "h-12 px-8 has-[>svg]:px-6 text-[16px]",
        xl: "h-14 px-10 has-[>svg]:px-7 text-[17px]",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        data-slot="button"
        className={cn(
          (variant === "default" || !variant) && "gradient-oro-azul",
          buttonVariants({ variant, size, className })
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
