Packing repository using repomix...
Querying Gemini AI using gemini-2.0-flash-thinking-exp-01-21...
Okay, let's create a detailed Product Requirements Document (PRD) for the Singapore MRT Fare Calculator application using Next.js and Shadcn UI.

# Product Requirements Document: Singapore MRT Fare Calculator

**1. Introduction**

This document outlines the requirements for a web-based Singapore MRT Fare Calculator application. The application aims to provide users with a simple and intuitive way to calculate MRT fares based on their chosen starting and ending stations. Leveraging the visual appeal and user-friendly components of Shadcn UI and the robust framework of Next.js, this application will be accessible, performant, and maintainable.

**2. Goals**

*   **Primary Goal:** To provide a user-friendly and accurate Singapore MRT fare calculator.
*   **Secondary Goals:**
    *   Offer multiple methods for station selection (map interaction and dropdown menus).
    *   Ensure the application is responsive and accessible across different devices.
    *   Utilize modern web technologies for performance and maintainability.
    *   Provide a visually appealing and intuitive user interface.

**3. Target Audience**

*   Commuters in Singapore who use the MRT system.
*   Tourists visiting Singapore who need to navigate the MRT.
*   Anyone needing to quickly estimate MRT fares for planning purposes.

**4. Features**

*   **MRT Map Interaction:**
    *   Display a clear and interactive map of the Singapore MRT network.
    *   Allow users to click on MRT stations on the map to select their starting and destination points.
    *   Visually highlight selected stations on the map.
    *   Provide station names on hover/click for clarity.
*   **Station Selection via Dropdowns:**
    *   Organize MRT stations into categorized dropdown menus based on MRT lines (e.g., North-South Line, East-West Line, etc.).
    *   Include an "All Stations" category for a complete alphabetical list.
    *   Implement a search/filter functionality within the dropdowns for quick station finding.
*   **Fare Calculation:**
    *   Accurately calculate the MRT fare based on the selected starting and destination stations.
    *   Display the calculated fare clearly in Singapore Dollars (SGD).
    *   Potentially display fare breakdowns (if available from data sources, e.g., distance-based fare + fixed charges).
*   **Route Display (Optional - Stretch Goal):**
    *   Visualize the shortest MRT route between selected stations on the map.
    *   List the stations along the calculated route.
*   **Clearance of Selections:**
    *   Provide a button or mechanism to easily clear selected starting and destination stations and reset the calculator.
*   **Responsive Design:**
    *   Ensure the application is fully responsive and works seamlessly on various screen sizes (desktops, tablets, and mobile devices).
*   **Accessibility:**
    *   Adhere to accessibility guidelines (WCAG) to ensure usability for users with disabilities.
    *   Provide proper ARIA attributes for interactive elements.
    *   Ensure sufficient color contrast for text and interactive elements.

**5. Technical Specifications**

*   **Frontend Framework:** Next.js (React framework for server-side rendering and routing)
*   **UI Kit/Component Library:** Shadcn UI (Tailwind CSS based component library for modern UI)
*   **Styling:** Tailwind CSS (Utility-first CSS framework, integrated with Shadcn UI)
*   **Mapping Library:**  Leaflet or Mapbox GL JS (For interactive MRT map display) - *Decision needed based on data format and ease of integration.*
*   **Programming Languages:** TypeScript (for type safety and better code maintainability), JavaScript (if necessary for specific libraries)
*   **State Management:** React Context API or Zustand (Lightweight state management for handling station selections and fare data)
*   **Testing:** Jest and React Testing Library (For unit and integration testing of components and logic)
*   **Deployment:** Vercel or Netlify (For easy deployment of Next.js applications)
*   **Version Control:** Git (using GitHub, GitLab, or Bitbucket)

**6. Data Sources and API Integration**

*   **MRT Station Data:**
    *   **Source 1 (Preferred):**  Official Singapore Land Transport Authority (LTA) Open Data portal or similar official government data sources. Look for datasets containing:
        *   Station names
        *   Station coordinates (latitude and longitude for map positioning)
        *   MRT line affiliations
        *   Potentially station codes or IDs for fare calculation lookups.
    *   **Source 2 (Alternative):** Community-maintained datasets (e.g., GitHub repositories, OpenStreetMap data). Verify accuracy and update frequency if using community data.
    *   **Data Format:**  Ideally JSON or CSV format for easy parsing in JavaScript.
*   **MRT Fare Data:**
    *   **Source 1 (Preferred):** LTA Open Data or official fare tables.  Look for data that defines fare calculation logic or provides fare matrices between stations.
    *   **Source 2 (Potentially needed API):** If direct fare data is not publicly available, investigate if there is an official or unofficial API that can calculate fares based on origin and destination stations.
    *   **Fare Calculation Logic:** Understand the Singapore MRT fare calculation logic (distance-based, peak/off-peak, concession fares etc.). For the initial version, focusing on standard adult fares is sufficient.  Concession fares can be a future enhancement.
*   **API Integration (if necessary):**
    *   If an API is used for fare calculation, document the API endpoints, request parameters, and response formats.
    *   Implement error handling for API requests (e.g., network errors, invalid responses).
    *   Consider API rate limits and caching strategies to optimize performance and avoid exceeding limits.

**7. UI/UX Design**

*   **Overall Style:** Clean, modern, and user-friendly, aligning with the Shadcn UI aesthetic.
*   **Homepage Layout:**
    *   Prominent display of the MRT map, taking up a significant portion of the screen (especially on desktop).
    *   Dropdown menus for station selection placed logically near the map or in a sidebar.
    *   Clear display area for the calculated fare.
    *   Minimalist design to avoid clutter and focus on the core functionality.
*   **Map Design:**
    *   Visually appealing and easy-to-understand representation of the MRT network.
    *   Clear station markers and line colors.
    *   Zoom and pan functionalities for map navigation.
    *   Tooltips or pop-ups to display station names on hover/click.
*   **Dropdown Design:**
    *   Well-organized and categorized dropdown menus for easy station selection.
    *   Search/filter functionality within dropdowns.
    *   Clear visual feedback when stations are selected from dropdowns.
*   **Fare Display:**
    *   Display the calculated fare in a prominent and easily readable format.
    *   Use clear currency symbols (SGD).
    *   Consider using a visually distinct section for the fare display.
*   **Color Palette:** Utilize a color palette that is accessible and visually appealing, possibly drawing inspiration from official Singapore MRT branding or public transport design guidelines.
*   **Typography:** Use clear and legible fonts for station names, fares, and other text elements.

**8. Implementation Plan**

*   **Phase 1: Project Setup and Data Integration (1-2 weeks)**
    *   Set up Next.js project with Shadcn UI and Tailwind CSS.
    *   Choose and integrate mapping library (Leaflet or Mapbox GL JS).
    *   Source and process MRT station data.
    *   Display MRT map with station markers.
    *   Implement basic station selection on the map (visual highlighting).
*   **Phase 2: Dropdown Station Selection and Fare Calculation Logic (2-3 weeks)**
    *   Implement station dropdown menus categorized by MRT lines.
    *   Connect dropdown selection to station highlighting on the map.
    *   Source or define MRT fare calculation logic.
    *   Implement fare calculation functionality based on selected stations.
    *   Display calculated fare.
*   **Phase 3: UI/UX Refinement, Testing, and Deployment (1-2 weeks)**
    *   Refine UI/UX based on usability best practices and feedback.
    *   Implement responsive design.
    *   Write unit and integration tests.
    *   Deploy the application to Vercel or Netlify.
    *   Conduct user testing and address any bugs or issues.

**9. Future Enhancements (Post-MVP)**

*   **Concession Fare Support:** Implement options for different passenger types (e.g., student, senior citizen) and calculate concession fares.
*   **Route Visualization:** Display the optimal MRT route on the map and list stations along the route.
*   **Journey Time Estimation:**  If data is available, estimate journey time based on selected stations.
*   **Real-time Service Status:** Integrate real-time MRT service status updates (if available via API).
*   **Multi-language Support:**  Localize the application for different languages.
*   **PWA (Progressive Web App) Features:**  Enable offline access and installability as a PWA.

**10. Success Metrics**

*   **User Engagement:**
    *   Number of unique visitors per month.
    *   Average session duration.
    *   Number of fare calculations performed.
*   **User Satisfaction:**
    *   User feedback through surveys or feedback forms.
    *   App store ratings (if deployed as a PWA).
*   **Performance Metrics:**
    *   Page load time.
    *   Application stability (error rate).
*   **Accuracy:**
    *   Verification of fare calculation accuracy against official fare tables.

This PRD provides a comprehensive outline for the Singapore MRT Fare Calculator application.  Regular review and updates to this document will be necessary throughout the development process to ensure alignment with project goals and user needs.