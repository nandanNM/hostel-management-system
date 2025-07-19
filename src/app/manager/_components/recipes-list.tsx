import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Leaf, Utensils } from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  type: "vegetarian" | "non-vegetarian";
  preparationTime: string;
  servings: number;
}

interface RecipesListProps {
  recipes: Recipe[];
}

export function RecipesList({ recipes }: RecipesListProps) {
  const getMealTypeIcon = (type: string) => {
    return type === "vegetarian" ? (
      <Leaf className="h-4 w-4" />
    ) : (
      <Utensils className="h-4 w-4" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          Today&apos;s Recipes
        </CardTitle>
        <CardDescription>Menu items being prepared today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                {getMealTypeIcon(recipe.type)}
                <div>
                  <h4 className="font-medium">{recipe.name}</h4>
                  <p className="text-muted-foreground text-sm">
                    {recipe.preparationTime} • {recipe.servings} servings
                  </p>
                </div>
              </div>
              <Badge
                variant={recipe.type === "vegetarian" ? "default" : "secondary"}
              >
                {recipe.type === "vegetarian" ? "Veg" : "Non-Veg"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
