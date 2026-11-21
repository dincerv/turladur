'use client';

import {
  createContext,
  useContext,
  type ChangeEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  type SyntheticEvent,
} from 'react';
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone';
import type {
  AgeRange,
  Destination,
  PickupPoint,
  RouteStop,
  TourDate,
  TourFormData,
} from './tour-form.types';

export type TourFormUiContextValue = {
  formData: TourFormData;
  setFormData: Dispatch<SetStateAction<TourFormData>>;
  errors: Record<string, string>;
  todayStr: string;
  isUploadingImages: boolean;
  uploadError: string | null;
  isSubmitting: boolean;
  isUpdateMode: boolean;
  step: 'basic' | 'details';
  setStep: Dispatch<SetStateAction<'basic' | 'details'>>;
  validateForm: () => Promise<boolean>;
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
  newLanguage: string;
  suggestions: string[];
  newTag: string;
  setNewTag: Dispatch<SetStateAction<string>>;
  newInclude: string;
  setNewInclude: Dispatch<SetStateAction<string>>;
  newExclude: string;
  setNewExclude: Dispatch<SetStateAction<string>>;
  newHealthPrivilege: string;
  setNewHealthPrivilege: Dispatch<SetStateAction<string>>;
  newFeature: string;
  setNewFeature: Dispatch<SetStateAction<string>>;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  handleDestinationsChange: (
    index: number,
    field: keyof Destination,
    value: string,
  ) => void;
  handleRemoveDepartureCity: (city: string) => void;
  handleMainImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleGalleryImagesChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleGalleryImageDescriptionChange: (index: number, value: string) => void;
  handleRemoveGalleryImage: (index: number) => void;
  handleReorderGalleryImages: (from: number, to: number) => void;
  handleImageRemove: (index: number) => void;
  handlePreviewImageError: (e: SyntheticEvent<HTMLImageElement>) => void;
  handlePickupPointsChange: (points: PickupPoint[]) => void;
  handleRouteStopsChange: (stops: RouteStop[]) => void;
  handleLanguageInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleAddLanguage: () => void;
  handleRemoveLanguage: (idx: number) => void;
  handleSuggestionClick: (suggestion: string) => void;
  handleRemoveTag: (idx: number) => void;
  handleRemoveInclude: (index: number) => void;
  handleRemoveExclude: (index: number) => void;
  handleRemoveHealthPrivilege: (index: number) => void;
  handleRemoveFeature: (index: number) => void;
  handleItineraryChange: (
    index: number,
    field: 'title' | 'description',
    value: string,
  ) => void;
  handleAddItineraryDay: () => void;
  handleRemoveItineraryDay: (index: number) => void;
  handleItineraryImageAdd: (dayIdx: number, files: FileList | null) => void;
  handleItineraryImageRemove: (dayIdx: number, imgIdx: number) => void;
  handleAddTourDate: () => void;
  handleTourDateChange: (
    index: number,
    field: keyof TourDate,
    value: string,
  ) => void;
  handleAddAgeRange: (tourDateIndex: number) => void;
  handleRemoveAgeRange: (tourDateIndex: number, ageIndex: number) => void;
  handleAgeRangeChange: (
    tourDateIndex: number,
    ageIndex: number,
    field: keyof AgeRange,
    value: string | number | null,
  ) => void;
  validateAgeRanges: (tourDateIndex: number) => boolean;
};

const TourFormUiContext = createContext<TourFormUiContextValue | null>(null);

export function TourFormUiProvider({
  value,
  children,
}: {
  value: TourFormUiContextValue;
  children: ReactNode;
}) {
  return (
    <TourFormUiContext.Provider value={value}>
      {children}
    </TourFormUiContext.Provider>
  );
}

export function useTourFormUi(): TourFormUiContextValue {
  const ctx = useContext(TourFormUiContext);
  if (!ctx) {
    throw new Error('useTourFormUi must be used within TourFormUiProvider');
  }
  return ctx;
}
