import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const FormView = () => {
  const { id } = useParams(); // Grabs the form ID from the URL (e.g., /forms/123abc)
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const docRef = doc(db, "forms", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData(docSnap.data());
        } else {
          console.log("No such form found!");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-(--color-secondary)">
        Loading form details...
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-(--color-accent) mb-4">
          Form Not Found
        </h2>
        <Link to="/forms" className="text-(--color-primary) hover:underline">
          Return to Forms Directory
        </Link>
      </div>
    );
  }

  const isPdf = formData.url.toLowerCase().includes(".pdf");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top Navigation & Dynamic Title */}
      <div className="mb-6">
        <Link
          to="/forms"
          className="text-sm text-(--color-secondary) hover:text-(--color-primary) transition mb-2 inline-block"
        >
          &larr; Back to Directory
        </Link>
        <h1 className="text-3xl font-bold text-(--color-primary) border-b pb-4 border-gray-200">
          {formData.title}
        </h1>
      </div>

      {/* Form Display */}
      <div className="flex flex-col items-center">
        <div className="w-full bg-(--color-background) p-4 shadow rounded min-h-125 flex flex-col items-center justify-center border border-gray-200 mb-6">
          {isPdf && (
            <p className="text-sm font-semibold text-(--color-secondary) mb-3">
              Document Preview (Page 1)
            </p>
          )}

          {/* Cloudinary .jpg magic trick for PDFs, normal display for Images */}
          <img
            src={formData.url.replace(".pdf", ".jpg")}
            alt={formData.title}
            className="max-w-full h-auto rounded object-contain shadow-sm border border-gray-300"
          />
        </div>

        {/* The Bulletproof Fallback */}
        <a
          href={formData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-(--color-primary) text-(--color-background) px-8 py-3 rounded shadow hover:opacity-90 transition font-semibold text-lg text-center"
        >
          Open Full File
        </a>
      </div>
    </div>
  );
};

export default FormView;
