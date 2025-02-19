import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../hooks/firebase"; // Firebase config file
import * as Speech from "expo-speech"; // Import Speech API
import { Ionicons } from "@expo/vector-icons"; // For mic icon

const NoteDescription = ({
  startRecording,
  stopRecording,
  transcribedSpeech,
  isRecording,
  isTranscribing,
  setTranscribedSpeech,
}) => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReading, setIsReading] = useState(false); // State to track reading status
  const [isTranscriptionVisible, setIsTranscriptionVisible] = useState(false);
  const { noteId } = useLocalSearchParams();
  const router = useRouter();

  // Fetch the note details
  useEffect(() => {
    const fetchNote = async () => {
      const docRef = doc(db, "sciencenotes", noteId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setNote(docSnap.data());
      }
      setLoading(false);
    };
    fetchNote();
  }, [noteId]);

  // Welcome speech when the note details are loaded
  useEffect(() => {
    if (note) {
      const welcomeMessage = `
      You are now viewing the note titled ${note.title}. 
      You can say "read" to hear the note read aloud, 
      or say "stop" to stop the reading. 
      Tap the mic button to begin speaking.`;

      Speech.speak(welcomeMessage);

      return () => {
        Speech.stop(); // Stop speech on unmount
      };
    }
  }, [note]);

  // Handle reading the note aloud
  const handleReadNote = () => {
    setIsReading(true); // Set reading status to true
    Speech.speak(`${note.title}. ${note.description}`, {
      onDone: () => setIsReading(false), // Reset reading status when done
      onStopped: () => setIsReading(false), // Reset reading status when stopped
    });
  };

  const stopReading = () => {
    Speech.stop(); // Stop reading
    setIsReading(false); // Update reading status
  };

  // Handle voice commands based on transcribed speech
  useEffect(() => {
    if (transcribedSpeech) {
      setIsTranscriptionVisible(true);

      const handleVoiceCommand = () => {
        const transcribedLower = transcribedSpeech.toLowerCase();
        
        if (transcribedLower.includes("read")) {
          handleReadNote();
        } else if (transcribedLower.includes("stop")) {
          stopReading();
        } else {
          Speech.speak("Sorry, I didn't understand. Please try again.");
        }

        setTranscribedSpeech(""); // Clear after handling the command
      };

      handleVoiceCommand();

      const timer = setTimeout(() => {
        setIsTranscriptionVisible(false);
        setTranscribedSpeech(""); // Clear after handling
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [transcribedSpeech]);

  // Handle mic button press
  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsTranscriptionVisible(true);
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#000080" style={styles.loader} />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>{note?.title}</Text>
        <Text style={styles.description}>{note?.description}</Text>

        {/* TouchableOpacity for "Read Aloud" button */}
        {!isReading && (
          <TouchableOpacity style={styles.readButton} onPress={handleReadNote}>
            <Text style={styles.buttonText}>Read Aloud</Text>
          </TouchableOpacity>
        )}

        {/* TouchableOpacity for "Stop Reading" button */}
        {isReading && (
          <TouchableOpacity style={styles.stopButton} onPress={stopReading}>
            <Text style={styles.buttonText}>Stop Reading</Text>
          </TouchableOpacity>
        )}

        {/* Add the mic button for voice commands */}
        <TouchableOpacity style={styles.micButton} onPress={handleMicPress}>
          <Ionicons
            name={isRecording ? "stop-circle" : "mic"}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        {/* Show transcription if available */}
        {isTranscribing && <Text>Transcribing...</Text>}
        {isTranscriptionVisible && !isTranscribing && transcribedSpeech && (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionText}>{transcribedSpeech}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    marginBottom: 16,
    textAlign: "center",
    color: "#000080",
  },
  description: {
    fontSize: 18,
    color: "#333",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  readButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#000080", // Blue background for read button
    borderRadius: 8,
    alignItems: "center",
  },
  stopButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#FF4D4D",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  micButton: {
    position: "absolute",
    bottom: 20,
    width: 60,
    height: 60,
    marginBottom: 20,
    borderRadius: 30,
    backgroundColor: "#000080",
    justifyContent: "center",
    alignItems: "center",
  },
  transcriptionContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transcriptionText: {
    fontSize: 16,
    color: "#000",
  },
});

export default NoteDescription;
