"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { projectsService } from "@/lib/projects";
import { useNotificationsRequired } from "@/contexts/notification-context";

interface Conversation {
  id: number;
  userMessage: string;
  aiResponse: string;
  createdAt: string;
}

export default function ProjectChatPage() {
  console.log("ProjectChatPage component rendering");
  
  const params = useParams();
  const router = useRouter();
  const { addNotification } = useNotificationsRequired();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [project, setProject] = useState<any>(null);
  
  console.log("Component state - loading:", loading, "params:", params);

  useEffect(() => {
    console.log("useEffect triggered, params.id:", params.id);
    
    const loadData = async () => {
      console.log("loadData function called");
      try {
        const projectId = parseInt(params.id as string);
        console.log("Parsed projectId:", projectId);
        
        // Load project details
        console.log("Calling getProject...");
        const projectData = await projectsService.getProject(projectId);
        console.log("Project data loaded:", projectData);
        setProject(projectData);
        
        // Load conversations
        console.log("Calling getProjectConversations...");
        const conversationsData = await projectsService.getProjectConversations(projectId);
        console.log("Conversations loaded:", conversationsData);
        setConversations(conversationsData);
      } catch (error) {
        console.error("Error loading chat data:", error);
        addNotification({
          type: "error",
          title: "Error",
          message: "Failed to load chat data",
        });
      } finally {
        console.log("Setting loading to false");
        setLoading(false);
      }
    };

    if (params.id) {
      loadData();
    }
  }, [params.id, addNotification]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const projectId = parseInt(params.id as string);
      const response = await projectsService.addConversation(projectId, message);
      
      // Create a conversation object since the API only returns { response: string }
      const newConversation: Conversation = {
        id: Date.now(), // Temporary ID
        userMessage: message,
        aiResponse: response.response,
        createdAt: new Date().toISOString(),
      };
      
      setConversations(prev => [...prev, newConversation]);
      setMessage("");
      
      addNotification({
        type: "success",
        title: "Message sent",
        message: "Your message has been sent to Easel AI",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to send message",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    console.log("Showing loading state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading chat data...</p>
        </div>
      </div>
    );
  }
  
  console.log("Rendering main component, project:", project);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/projects/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>
        </Button>
      </div>

      <Card className="h-[calc(100vh-200px)] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Chat with Easel AI
            {project && (
              <span className="text-sm font-normal text-muted-foreground">
                - {project.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 mb-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Debug info - remove this later */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                  <p>Debug: Project loaded: {project ? 'Yes' : 'No'}</p>
                  <p>userRequirements: "{project?.userRequirements || 'empty'}"</p>
                  <p>processedRequirements: "{project?.processedRequirements || 'empty'}"</p>
                </div>
              )}
              
              {/* Show AI's initial analysis or user requirements */}
              {project && (project.processedRequirements || project.userRequirements) && (
                <div className="space-y-4 border-b pb-4 mb-4">
                  <div className="flex justify-start">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-[85%]">
                      <p className="text-sm font-medium mb-2">
                        {project.processedRequirements ? "My Analysis:" : "Your Requirements:"}
                      </p>
                      <div className="text-sm text-gray-700 space-y-1">
                        {(project.processedRequirements || project.userRequirements)
                          .split("\n")
                          .map((line: string, index: number) => (
                            <p key={index}>{line}</p>
                          ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Easel AI • {project.processedRequirements ? "Project Analysis" : "Based on your input"}
                      </p>
                    </div>
                  </div>
                  
                  {/* AI's refinement prompt */}
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 max-w-[85%]">
                      <p className="text-sm">
                        I've analyzed your requirements above. To help me provide better Azure resource recommendations, could you help me understand:
                      </p>
                      <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                        <li>What's your expected user load or traffic volume?</li>
                        <li>Do you have any specific performance requirements?</li>
                        <li>Are there any compliance or security requirements?</li>
                        <li>What's your preferred budget range?</li>
                        <li>Do you need high availability or disaster recovery?</li>
                      </ul>
                      <p className="text-sm mt-2">
                        Feel free to answer any of these questions or share additional details about your project!
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Easel AI • Refinement Questions
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {conversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Continue the conversation below!
                </div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[70%]">
                        <p className="text-sm">{conv.userMessage}</p>
                        <p className="text-xs opacity-70 mt-1">
                          You • {conv.createdAt ? new Date(conv.createdAt).toLocaleTimeString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                        <p className="text-sm">{conv.aiResponse || 'No response available'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Easel AI • {conv.createdAt ? new Date(conv.createdAt).toLocaleTimeString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !message.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}