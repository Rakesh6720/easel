// Mock data for individual project details
export const projectRequirements: Record<number, string> = {
  1: "Need a scalable e-commerce platform with user authentication, product catalog, shopping cart, and payment integration. Expected to handle 1000+ concurrent users with room for growth.",
  2: "Real-time analytics dashboard for processing and visualizing large datasets. Need to handle streaming data, generate reports, and provide insights with low latency.",
  3: "Backend API services for mobile application. Need user authentication, push notifications, caching layer, and real-time features for chat and updates.",
};

export const processedRequirements: Record<number, string> = {
  1: `## E-commerce Web Application Analysis

**Application Type:** E-commerce Web Platform  
**Expected Scale:** Medium to high traffic (1000+ concurrent users)

### Core Requirements
- **User Authentication:** Secure login/registration system
- **Product Catalog:** Searchable product listings with categories
- **Shopping Cart:** Session-based cart with persistence
- **Payment Processing:** Integration with payment providers

### Technical Specifications
- **Performance Target:** Handle 1000+ concurrent users
- **Payment Integration:** Stripe/PayPal compatibility required
- **Security:** PCI compliance considerations for payment data

### Recommended Architecture
1. **Frontend:** React/Next.js web application
2. **Backend:** RESTful API with authentication
3. **Database:** SQL database for transactional data
4. **Payments:** Secure payment gateway integration`,

  2: `## Analytics & Data Processing Platform

**Application Type:** Real-time Analytics Dashboard  
**Expected Scale:** High volume data ingestion and processing

### Core Features
- **Real-time Processing:** Stream analytics for live data
- **Dashboard Visualization:** Interactive charts and reports  
- **Data Storage:** Scalable data warehouse solution
- **Query Performance:** Low latency for analytical queries

### Performance Requirements
- **Latency:** Sub-second query response times
- **Throughput:** Handle high-volume streaming data
- **Scalability:** Auto-scaling based on data load

### Integration Points
- Multiple data sources (APIs, databases, files)
- Visualization tools and reporting systems
- Real-time alerting and notifications

### Security & Compliance
- Data encryption in transit and at rest
- Role-based access controls
- Audit logging for data access`,

  3: `## Mobile Backend API Services

**Application Type:** Backend API for Mobile Application  
**Expected Scale:** Growing mobile user base with real-time features

### API Requirements
- **RESTful API:** Clean, documented API endpoints
- **Authentication:** JWT-based user authentication
- **Push Notifications:** Cross-platform notification delivery
- **Real-time Features:** WebSocket support for chat/updates

### Performance Targets
- **Response Time:** < 200ms average API response
- **Availability:** 99.9% uptime requirement
- **Scalability:** Auto-scaling based on mobile traffic

### Technical Components
1. **API Gateway:** Rate limiting and request routing
2. **Caching Layer:** Redis for session and data caching  
3. **Database:** NoSQL for flexible mobile data storage
4. **Message Queue:** Async processing for notifications

### Mobile Integrations
- iOS and Android SDK compatibility
- Push notification services (APNS, FCM)
- Real-time communication protocols`,
};

export interface ProjectConversation {
  id: number;
  userMessage: string;
  assistantResponse: string;
  createdAt: string;
}

export const projectConversations: Record<number, ProjectConversation[]> = {
  1: [
    {
      id: 1,
      userMessage: "I need to add Redis caching for better performance",
      assistantResponse:
        "Great idea! Redis caching will significantly improve your e-commerce platform's performance. I recommend Azure Cache for Redis with the Basic C1 tier to start. This will provide 1GB cache and handle your current load efficiently. Would you like me to add this to your resource recommendations?",
      createdAt: "2024-01-19T16:30:00Z",
    },
    {
      id: 2,
      userMessage: "What about CDN for static assets?",
      assistantResponse:
        "Absolutely! Azure CDN will improve load times for your static assets like images and CSS. I recommend Azure CDN Standard from Microsoft with global distribution. This will cache your content closer to users worldwide and reduce bandwidth costs on your App Service.",
      createdAt: "2024-01-19T15:45:00Z",
    },
  ],
  2: [
    {
      id: 3,
      userMessage:
        "How can I optimize my analytics pipeline for real-time processing?",
      assistantResponse:
        "For real-time analytics, I recommend Azure Stream Analytics paired with Event Hubs. This combination provides low-latency processing and can handle high-volume data streams. We should also consider Azure Synapse Analytics for complex analytical workloads.",
      createdAt: "2024-01-21T09:15:00Z",
    },
    {
      id: 4,
      userMessage: "What about data visualization tools?",
      assistantResponse:
        "Power BI integrates seamlessly with your Azure analytics stack. You can connect it directly to your data sources and create interactive dashboards. For real-time visualization, consider using Power BI streaming datasets.",
      createdAt: "2024-01-21T08:30:00Z",
    },
  ],
  3: [
    {
      id: 5,
      userMessage: "I need push notification support for my mobile app",
      assistantResponse:
        "Azure Notification Hubs is perfect for this! It supports cross-platform push notifications and can scale to millions of devices. I'll help you set up templates for iOS and Android notifications with personalization support.",
      createdAt: "2024-01-21T11:20:00Z",
    },
    {
      id: 6,
      userMessage: "How should I implement real-time chat features?",
      assistantResponse:
        "Azure SignalR Service is ideal for real-time communication features. It handles WebSocket connections automatically and scales horizontally. We can integrate it with your API to provide instant messaging, presence indicators, and group chat functionality.",
      createdAt: "2024-01-21T10:45:00Z",
    },
  ],
};

// Helper functions for project-specific data
export function getProjectRequirements(projectId: number): string {
  return (
    projectRequirements[projectId] || "Project requirements not specified."
  );
}

export function getProcessedRequirements(projectId: number): string {
  return (
    processedRequirements[projectId] ||
    "Application Type: Unknown\nRequirements processing needed."
  );
}

export function getConversationsForProject(
  projectId: number
): ProjectConversation[] {
  return projectConversations[projectId] || [];
}
