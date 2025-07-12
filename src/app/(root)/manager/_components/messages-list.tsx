// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { MessageSquare } from "lucide-react";
// import type { Message } from "@/types/manager";

// interface MessagesListProps {
//   messages: Message[];
// }

// export function MessagesList({ messages }: MessagesListProps) {
//   const getMessageTypeColor = (type: Message["type"]) => {
//     switch (type) {
//       case "urgent":
//         return "destructive";
//       case "feedback":
//         return "default";
//       default:
//         return "secondary";
//     }
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <MessageSquare className="h-5 w-5" />
//           Meal Messages
//         </CardTitle>
//         <CardDescription>Recent communications and updates</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <ScrollArea className="h-[300px]">
//           <div className="space-y-4">
//             {messages.map((message, index) => (
//               <div key={message.id}>
//                 <div className="flex items-start gap-3">
//                   <Badge
//                     variant={getMessageTypeColor(message.type)}
//                     className="mt-1"
//                   >
//                     {message.type}
//                   </Badge>
//                   <div className="min-w-0 flex-1">
//                     <div className="mb-1 flex items-center gap-2">
//                       <p className="text-sm font-medium">{message.from}</p>
//                       <span className="text-muted-foreground text-xs">
//                         {message.timestamp}
//                       </span>
//                     </div>
//                     <p className="text-muted-foreground text-sm">
//                       {message.content}
//                     </p>
//                   </div>
//                 </div>
//                 {index < messages.length - 1 && <Separator className="mt-4" />}
//               </div>
//             ))}
//           </div>
//         </ScrollArea>
//       </CardContent>
//     </Card>
//   );
// }
