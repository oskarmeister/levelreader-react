import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Nav from "./components/Nav";
import AccountView from "./components/AccountView";
import LibraryView from "./components/LibraryView";
import WordBankView from "./components/WordBankView";
import ImportView from "./components/ImportView";
import GenerateView from "./components/GenerateView";
import LessonView from "./components/LessonView";
import EditView from "./components/EditView";
import Sidebar from "./components/Sidebar";
import AppContext from "./context/AppContext";
import { ApiManager } from "./api/apiManager";

function App() {
  // Helper function to get current language data
  const getCurrentLanguageData = (state) => {
    return (
      state.languageData[state.selectedLanguage] || {
        lessons: {},
        lessonCategories: {},
        recentlyAccessedLessons: [],
        recentlyAccessedCategories: [],
        wordMetadata: {},
        translationCache: {},
        deletedWords: [],
        lessonSegmentations: {},
      }
    );
  };

  // Helper function to sync current language data to legacy state properties
  const syncLanguageData = (state) => {
    const currentData = getCurrentLanguageData(state);
    return {
      ...state,
      lessons: currentData.lessons,
      lessonCategories: currentData.lessonCategories,
      recentlyAccessedLessons: currentData.recentlyAccessedLessons,
      recentlyAccessedCategories: currentData.recentlyAccessedCategories,
      wordMetadata: currentData.wordMetadata,
      translationCache: currentData.translationCache,
      deletedWords: currentData.deletedWords,
      lessonSegmentations: currentData.lessonSegmentations,
    };
  };

  const [state, setState] = useState({
    token: localStorage.getItem("token"),
    selectedLanguage: localStorage.getItem("selectedLanguage") || "Spanish",
    languageData: {
      Spanish: {
        lessons: {
          "El Principito":
            "En el desierto, he aprendido a escuchar. Todo lo que necesitaba era una pequeña brisa para escuchar las voces de aquellos que amo.",
          "Café Matutino":
            "El aroma de los granos de café recién molidos llenó la pequeña cocina, llevando consigo la promesa de un nuevo día.",
        },
        lessonCategories: {
          "El Principito": ["books"],
          "Café Matutino": ["food"],
        },
        recentlyAccessedLessons: [],
        recentlyAccessedCategories: [],
        wordMetadata: {},
        translationCache: {},
        deletedWords: [],
        lessonSegmentations: {},
      },
      Swedish: {
        lessons: {
          "Lille Prinsen":
            "I öknen har jag lärt mig att lyssna. Allt jag behövde var en liten bris för att höra rösterna från dem jag älskar.",
        },
        lessonCategories: { "Lille Prinsen": ["books"] },
        recentlyAccessedLessons: [],
        recentlyAccessedCategories: [],
        wordMetadata: {},
        translationCache: {},
        deletedWords: [],
      },
      Chinese: {
        lessons: {
          小王子:
            "在沙漠中，我学会了倾听。我所需要的只是一阵微风，就能听到我所爱的人的声音。",
        },
        lessonCategories: { 小王子: ["books"] },
        recentlyAccessedLessons: [],
        recentlyAccessedCategories: [],
        wordMetadata: {},
        translationCache: {},
        deletedWords: [],
        lessonSegmentations: {}, // Store segmented text for Chinese lessons
      },
      English: {
        lessons: {
          "The Little Prince":
            "In the desert, I have learned to listen. All I needed was a little breeze to hear the voices of those I love.",
        },
        lessonCategories: { "The Little Prince": ["books"] },
        recentlyAccessedLessons: [],
        recentlyAccessedCategories: [],
        wordMetadata: {},
        translationCache: {},
        deletedWords: [],
      },
      German: {
        lessons: {
          "Der Kleine Prinz":
            "In der Wüste habe ich gelernt zu hören. Alles was ich brauchte war eine kleine Brise.",
        },
        lessonCategories: { "Der Kleine Prinz": ["books"] },
        recentlyAccessedLessons: [],
        recentlyAccessedCategories: [],
        wordMetadata: {},
        translationCache: {},
        deletedWords: [],
      },
      French: {
        lessons: {
          "Le Petit Prince":
            "Dans le désert, j'ai appris à écouter. Tout ce dont j'avais besoin était une petite brise.",
        },
        lessonCategories: { "Le Petit Prince": ["books"] },
        recentlyAccessedLessons: [],
        recentlyAccessedCategories: [],
        wordMetadata: {},
        translationCache: {},
        deletedWords: [],
      },
    },
    lessons: {
      "The Little Prince":
        "In the desert, I have learned to listen. All I needed was a little breeze to hear the voices of those I love. The stars whisper secrets to those who know how to listen. Each grain of sand holds a story waiting to be told.",
      "Morning Coffee":
        "The aroma of freshly ground coffee beans filled the small kitchen, carrying with it the promise of a new day. Steam rose from the ceramic mug like tiny clouds ascending to heaven, curling upward in graceful spirals that danced in the morning light streaming through the window. Each sip was a moment of peace before the busy day began, a ritual that connected the sleepy mind to the awakening world outside. The rich, dark liquid warmed her hands as she cradled the cup, feeling its familiar weight and texture. She had inherited this particular mug from her grandmother, its faded blue flowers telling stories of countless mornings and shared conversations. The coffee itself was a blend she had discovered during her travels to Colombia, where she had learned about the meticulous process of cultivation, harvesting, and roasting that brought each precious bean to life. In the early morning silence, she could hear the gentle bubbling of the coffee maker as it finished its cycle, the sound punctuating the stillness like a mechanical heartbeat. Outside her kitchen window, the world was slowly stirring to life. A jogger passed by on the sidewalk, her rhythmic footsteps creating a steady percussion against the pavement. The newspaper delivery truck rumbled down the street, leaving behind folded copies of the daily news that would soon be devoured along with breakfast tables across the neighborhood. As she took another sip, she reflected on the journey her coffee had taken to reach this moment. From volcanic soil thousands of miles away, through the hands of farmers who tended the plants with generations of knowledge, to the roasters who carefully coaxed out the perfect balance of flavors, and finally to her local coffee shop where she had purchased these beans just yesterday. The barista there, a young man named David with intricate tattoos covering his forearms, had recommended this particular roast for its notes of chocolate and caramel. He had ground the beans fresh for her, the machine whirring loudly as it reduced the hard shells to the perfect consistency for her French press at home. Now, as the caffeine slowly awakened her senses, she began to plan her day. There was the important presentation at work, the lunch meeting with her sister, and the evening yoga class she had been looking forward to all week. But for now, in this quiet sanctuary of her kitchen, surrounded by the familiar sights and sounds of morning, she simply existed in the present moment. The sun climbed higher, painting golden streaks across the white tiles of her countertop. A cat meowed somewhere in the distance, probably asking for its breakfast from a sleepy owner. The coffee was nearly finished, she noticed, and soon she would need to join the river of commuters flowing toward the city center. But not yet. She had learned to treasure these small pockets of solitude, these brief interludes between sleep and the demands of modern life. Another sip, another moment of gratitude for this simple pleasure that had become such an integral part of her daily routine.",
      "Ocean Waves":
        "The waves crashed against the rocky shore with rhythmic persistence. Seagulls danced in the salty breeze while children built sandcastles that would soon be claimed by the tide. The ocean holds infinite mysteries beneath its surface.",
      "City Lights":
        "Neon signs flickered against the night sky, painting the wet streets in colorful reflections. Taxi cabs honked their way through the bustling traffic while people hurried home from late dinners and evening shows.",
      "Garden Stories":
        "Tomatoes ripened slowly in the summer heat while bees collected nectar from the lavender bushes. The old gardener smiled as he watered each plant with care, knowing that patience yields the sweetest harvest.",
      "Train Journey":
        "The locomotive whistle echoed through the valley as passengers settled into their seats with books and warm tea. Mountains passed by the window like ancient guardians watching over the winding tracks below.",
    },
    lessonCategories: {
      "The Little Prince": ["books"],
      "Morning Coffee": ["food"],
      "Ocean Waves": ["travel"],
      "City Lights": ["travel"],
      "Garden Stories": ["hobbies"],
      "Train Journey": ["travel"],
    },
    recentlyAccessedLessons: [],
    recentlyAccessedCategories: [],
    wordMetadata: {
      desert: { fam: "2" },
      learned: { fam: "known" },
      listen: { fam: "known" },
      breeze: { fam: "1" },
      voices: { fam: "known" },
      stars: { fam: "known" },
      whisper: { fam: "2" },
      secrets: { fam: "known" },
      aroma: { fam: "1" },
      freshly: { fam: "2" },
      ground: { fam: "known" },
      coffee: { fam: "known" },
      beans: { fam: "known" },
      kitchen: { fam: "known" },
      steam: { fam: "2" },
      ceramic: { fam: "1" },
      clouds: { fam: "known" },
      ascending: { fam: "1" },
      heaven: { fam: "known" },
      peace: { fam: "known" },
      waves: { fam: "known" },
      crashed: { fam: "2" },
      rocky: { fam: "known" },
      shore: { fam: "2" },
      rhythmic: { fam: "1" },
      persistence: { fam: "1" },
      seagulls: { fam: "2" },
      danced: { fam: "known" },
      salty: { fam: "known" },
      children: { fam: "known" },
      sandcastles: { fam: "2" },
      tide: { fam: "2" },
      ocean: { fam: "known" },
      infinite: { fam: "1" },
      mysteries: { fam: "2" },
      beneath: { fam: "2" },
      surface: { fam: "known" },
    },
    translationCache: {},
    deletedWords: [],
    filterValue: "all",
    currentText: "",
    editingKey: "",
    currentPage: 0,
    currentMode: "page",
    sidebarOpen: false,
    selectedWord: "",
    username: localStorage.getItem("username") || "",
  });

  // Sync language data when language changes
  useEffect(() => {
    setState((prev) => syncLanguageData(prev));
    localStorage.setItem("selectedLanguage", state.selectedLanguage);
  }, [state.selectedLanguage]);

  // Initialize with current language data
  useEffect(() => {
    setState((prev) => syncLanguageData(prev));
  }, []);

  useEffect(() => {
    if (state.token) {
      // Check if it's dev mode and load dev data from localStorage
      if (state.token.startsWith("dev_token_")) {
        const devData = localStorage.getItem("dev_data");
        if (devData) {
          const parsedData = JSON.parse(devData);
          setState((prev) => ({
            ...prev,
            lessons: parsedData.lessons || prev.lessons,
            wordMetadata: parsedData.wordMetadata || prev.wordMetadata,
            translationCache:
              parsedData.translationCache || prev.translationCache,
            deletedWords: parsedData.deletedWords || prev.deletedWords,
            lessonCategories:
              parsedData.lessonCategories || prev.lessonCategories,
            recentlyAccessedLessons:
              parsedData.recentlyAccessedLessons ||
              prev.recentlyAccessedLessons,
            recentlyAccessedCategories:
              parsedData.recentlyAccessedCategories ||
              prev.recentlyAccessedCategories,
          }));
        }
      } else {
        ApiManager.loadUserData(state, setState);
      }
    }
  }, [state.token]);

  return (
    <AppContext.Provider value={{ state, setState }}>
      <Router>
        <div className="min-h-screen bg-background">
          <Nav />
          <main className="pt-16 pb-16">
            {" "}
            {/* Padding for fixed nav and bottom controls */}
            <Routes>
              <Route path="/account" element={<AccountView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/wordbank" element={<WordBankView />} />
              <Route path="/import" element={<ImportView />} />
              <Route path="/generate" element={<GenerateView />} />
              <Route path="/lesson/:key" element={<LessonView />} />
              <Route path="/edit/:key" element={<EditView />} />
              <Route
                path="/"
                element={
                  state.token ? (
                    <Navigate to="/library" />
                  ) : (
                    <Navigate to="/account" />
                  )
                }
              />
            </Routes>
          </main>
          <Sidebar />
        </div>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
