import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "text-white shadow-md hover:shadow-lg btn-hover-glow water-shine",
        destructive:
          "bg-red-600 text-white shadow-md hover:shadow-lg hover:bg-red-700 hover:scale-[1.02]",
        outline:
          "border-2 border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.02]",
        secondary:
          "bg-[#F0F8FF] text-[#005691] shadow-sm hover:shadow-md hover:bg-[#E1EFF9] hover:scale-[1.02] border border-primary/10",
        ghost:
          "hover:bg-[#F0F8FF] hover:text-[#005691] hover:scale-[1.02]",
        link: "text-[#005691] underline-offset-4 hover:underline font-medium",
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
          variant === "default" && "gradient-oro-azul",
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
