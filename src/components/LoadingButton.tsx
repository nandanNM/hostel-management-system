import React from "react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"

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
      {loading ? <Loader variant="comet" size={16} /> : children}
    </Button>
  )
}

export default LoadingButton
