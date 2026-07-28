import React from "react"
import { CircleNotch as Loader2Icon } from "@phosphor-icons/react/ssr"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

interface LoadingButtonProps extends ButtonProps {
  loading: boolean
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  disabled,
  className,
  children,
  ...props
}) => {
  return (
    <Button
      disabled={loading || disabled}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {loading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : children}
    </Button>
  )
}

export default LoadingButton
