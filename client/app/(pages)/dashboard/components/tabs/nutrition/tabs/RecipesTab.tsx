"use client";

import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit3,
  Heart,
  ChefHat,
  Check,
  Flame,
  Timer,
  Utensils,
} from "lucide-react";
import type { Recipe } from "@/src/shared/services";
import { RecipeSkeleton } from "../Skeletons";

interface RecipesTabProps {
  recipes: Recipe[];
  recipesLoading: boolean;
  selectedRecipeIds: Set<string>;
  recipeFilterCategory: string | null;
  showFavoritesOnly: boolean;
  onRecipeSelect: (recipeId: string) => void;
  onRecipesDelete: () => void;
  onRecipeFavorite: (recipeId: string) => void;
  onRecipeEdit: (recipe: Recipe) => void;
  onRecipeDelete: (recipeId: string) => void;
  onRecipeView: (recipe: Recipe) => void;
  onRecipeCreate: () => void;
  onFilterCategoryChange: (category: string | null) => void;
  onFavoritesToggle: () => void;
}

export function RecipesTab({
  recipes,
  recipesLoading,
  selectedRecipeIds,
  recipeFilterCategory,
  showFavoritesOnly,
  onRecipeSelect,
  onRecipesDelete,
  onRecipeFavorite,
  onRecipeEdit,
  onRecipeDelete,
  onRecipeView,
  onRecipeCreate,
  onFilterCategoryChange,
  onFavoritesToggle,
}: RecipesTabProps) {
  const categories = [
    { id: null, label: "All" },
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "snack", label: "Snack" },
    { id: "dessert", label: "Dessert" },
  ];

  const filteredRecipes = recipes.filter((r) => {
    if (recipeFilterCategory && r.category !== recipeFilterCategory) return false;
    if (showFavoritesOnly && !r.isFavorite) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">My Recipes</h3>
          <span className="text-sm text-slate-500">({recipes.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedRecipeIds.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRecipesDelete}
              className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2 hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedRecipeIds.size})
            </motion.button>
          )}
          <button
            onClick={onFavoritesToggle}
            className={`p-2 rounded-xl transition-colors ${
              showFavoritesOnly
                ? "bg-pink-500/20 text-pink-400"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            title={showFavoritesOnly ? "Show all" : "Show favorites only"}
          >
            <Heart className={`w-5 h-5 ${showFavoritesOnly ? "fill-current" : ""}`} />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRecipeCreate}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm flex items-center gap-2 hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Recipe
          </motion.button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id || "all"}
            onClick={() => onFilterCategoryChange(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              recipeFilterCategory === cat.id
                ? "bg-emerald-500 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      {recipesLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <RecipeSkeleton key={i} />
          ))}
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-8 text-center">
          <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h4 className="text-white font-medium mb-2">No recipes yet</h4>
          <p className="text-slate-400 text-sm mb-4">
            {showFavoritesOnly
              ? "No favorite recipes. Mark recipes as favorites to see them here."
              : "Create your first recipe to build your personal cookbook."}
          </p>
          {!showFavoritesOnly && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRecipeCreate}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
            >
              Create Your First Recipe
            </motion.button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl border p-5 transition-all group cursor-pointer ${
                selectedRecipeIds.has(recipe.id)
                  ? "bg-red-500/5 border-red-500/30"
                  : "bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/50"
              }`}
              onClick={(e) => {
                // Don't trigger view if clicking on action buttons or checkbox
                if (
                  (e.target as HTMLElement).closest("button") ||
                  (e.target as HTMLElement).closest('[role="button"]')
                ) {
                  return;
                }
                onRecipeView(recipe);
              }}
            >
              {/* Selection checkbox */}
              <div className="flex items-start justify-between mb-3">
                <button
                  onClick={() => onRecipeSelect(recipe.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedRecipeIds.has(recipe.id)
                      ? "border-red-500 bg-red-500"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  {selectedRecipeIds.has(recipe.id) && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onRecipeFavorite(recipe.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      recipe.isFavorite
                        ? "text-pink-400 hover:bg-pink-500/20"
                        : "text-slate-500 hover:text-pink-400 hover:bg-white/5"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${recipe.isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={() => onRecipeEdit(recipe)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRecipeDelete(recipe.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recipe Image Placeholder */}
              <div className="w-full h-32 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 mb-4 flex items-center justify-center relative overflow-hidden">
                {recipe.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ChefHat className="w-12 h-12 text-emerald-400/50" />
                )}
                {recipe.isFavorite && (
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-pink-500/90">
                    <Heart className="w-3 h-3 text-white fill-current" />
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                    <span
                      className={`text-[10px] font-medium ${
                        recipe.difficulty === "easy"
                          ? "text-green-400"
                          : recipe.difficulty === "hard"
                          ? "text-red-400"
                          : "text-amber-400"
                      }`}
                    >
                      {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Recipe Info */}
              <h4 className="font-semibold text-white mb-1 line-clamp-1">{recipe.name}</h4>
              {recipe.description && (
                <p className="text-xs text-slate-400 mb-2 line-clamp-2">{recipe.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                {recipe.caloriesPerServing && (
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    {recipe.caloriesPerServing} kcal
                  </span>
                )}
                {(recipe.prepTimeMinutes || recipe.cookTimeMinutes) && (
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Utensils className="w-3 h-3" />
                    {recipe.servings} serv
                  </span>
                )}
              </div>

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {recipe.tags.length > 3 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-[10px] font-medium">
                      +{recipe.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

