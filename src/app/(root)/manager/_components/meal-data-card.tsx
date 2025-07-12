"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Leaf, Utensils, ChefHat } from "lucide-react";
import { toast } from "sonner";

interface MealData {
  date: string;
  vegetarian: number;
  nonVegetarian: number;
  totalMeals: number;
}
interface MealDataCardProps {
  mealData: MealData | null;
  onGenerate: (data: MealData) => void;
}

export function MealDataCard({ mealData, onGenerate }: MealDataCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMealData = () => {
    setIsGenerating(true);

    // Simulate API call
    setTimeout(() => {
      const newMealData: MealData = {
        date: new Date().toISOString().split("T")[0],
        vegetarian: Math.floor(Math.random() * 50) + 40,
        nonVegetarian: Math.floor(Math.random() * 60) + 50,
        totalMeals: 0,
      };
      newMealData.totalMeals =
        newMealData.vegetarian + newMealData.nonVegetarian;

      onGenerate(newMealData);
      setIsGenerating(false);

      toast.success(`Today's meal data has been generated successfully.`);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Today&apos;s Meal Data
        </CardTitle>
        <CardDescription>
          Generate and view today&apos;s meal statistics and requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateMealData}
          disabled={isGenerating}
          className="w-full sm:w-auto"
        >
          {isGenerating ? "Generating..." : "Generate Today's Meal Data"}
        </Button>

        {mealData && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Vegetarian</h3>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {mealData.vegetarian}
                </p>
                <p className="text-muted-foreground text-sm">meals today</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Utensils className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold">Non-Vegetarian</h3>
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {mealData.nonVegetarian}
                </p>
                <p className="text-muted-foreground text-sm">meals today</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <ChefHat className="text-primary h-5 w-5" />
                  <h3 className="font-semibold">Total Meals</h3>
                </div>
                <p className="text-primary text-3xl font-bold">
                  {mealData.totalMeals}
                </p>
                <p className="text-muted-foreground text-sm">meals today</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
