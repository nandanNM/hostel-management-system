"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEventHandler,
  type ReactNode,
} from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type TagsContextType = {
  value?: string[]
  setValue?: (value: string[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  width?: number
  setWidth?: (width: number) => void
}

const TagsContext = createContext<TagsContextType>({
  value: undefined,
  setValue: undefined,
  open: false,
  onOpenChange: () => {},
  width: undefined,
  setWidth: undefined,
})

const useTagsContext = () => {
  const context = useContext(TagsContext)
  if (!context) {
    throw new Error("useTagsContext must be used within a TagsProvider")
  }
  return context
}

export type TagsProps = {
  value?: string[]
  setValue?: (value: string[]) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
  className?: string
}

export const Tags = ({
  value,
  setValue,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
  className,
}: TagsProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [width, setWidth] = useState<number>()
  const ref = useRef<HTMLDivElement>(null)

  const open = controlledOpen ?? uncontrolledOpen
  const onOpenChange = controlledOnOpenChange ?? setUncontrolledOpen

  useEffect(() => {
    if (!ref.current) {
      return
    }
    const resizeObserver = new ResizeObserver((entries) => {
      // Add a check for entries[0]
      if (entries[0]) {
        setWidth(entries[0].contentRect.width)
      }
    })
    resizeObserver.observe(ref.current)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <TagsContext.Provider
      value={{ value, setValue, open, onOpenChange, width, setWidth }}
    >
      <Popover onOpenChange={onOpenChange} open={open}>
        <div className={cn("relative w-full", className)} ref={ref}>
          {children}
        </div>
      </Popover>
    </TagsContext.Provider>
  )
}

export type TagsTriggerProps = ComponentProps<typeof Button>

export const TagsTrigger = ({
  className,
  children,
  ...props
}: TagsTriggerProps) => (
  <PopoverTrigger asChild>
    <Button
      className={cn("h-auto w-full justify-between p-2", className)}
      role="combobox"
      variant="outline"
      {...props}
    >
      <div className="flex flex-wrap items-center gap-1">
        {children}
        {(!children ||
          (Array.isArray(children) &&
            children.every((child) => child === null))) && (
          <span className="text-muted-foreground px-2 py-px">
            Select an option...
          </span>
        )}
      </div>
    </Button>
  </PopoverTrigger>
)

export type TagsValueProps = ComponentProps<typeof Badge>

export const TagsValue = ({
  className,
  children,
  onRemove,
  ...props
}: TagsValueProps & { onRemove?: () => void }) => {
  const handleRemove: MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onRemove?.()
  }
  return (
    <Badge className={cn("flex items-center gap-2", className)} {...props}>
      {children}
      {onRemove && (
        <div
          className="hover:text-muted-foreground flex size-auto h-auto cursor-pointer items-center justify-center p-0"
          onClick={handleRemove}
          aria-label={`Remove ${children} tag`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onRemove?.()
            }
          }}
        >
          <XIcon size={12} />
        </div>
      )}
    </Badge>
  )
}

export type TagsContentProps = ComponentProps<typeof PopoverContent>

export const TagsContent = ({
  className,
  children,
  ...props
}: TagsContentProps) => {
  const { width } = useTagsContext()
  return (
    <PopoverContent
      className={cn("p-0", className)}
      style={{ width }}
      {...props}
    >
      <Command>{children}</Command>
    </PopoverContent>
  )
}

// TagsInput is removed as per request

export type TagsListProps = ComponentProps<typeof CommandList>

export const TagsList = ({ className, ...props }: TagsListProps) => (
  <CommandList className={cn("max-h-[200px]", className)} {...props} />
)

export type TagsEmptyProps = ComponentProps<typeof CommandEmpty>

export const TagsEmpty = ({ children, ...props }: TagsEmptyProps) => (
  <CommandEmpty {...props}>{children ?? "No tags found."}</CommandEmpty>
)

export type TagsGroupProps = ComponentProps<typeof CommandGroup>

export const TagsGroup = CommandGroup

export type TagsItemProps = ComponentProps<typeof CommandItem>

export const TagsItem = ({ className, ...props }: TagsItemProps) => (
  <CommandItem
    className={cn("cursor-pointer items-center justify-between", className)}
    {...props}
  />
)
