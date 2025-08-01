/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/products/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { XCircle } from "lucide-react";
import Image from "next/image";

// --- Import du composant TipTap Editor ---
import TipTapEditorWrapper from "@/components/tiptap-editor";
import { Product } from "@/components/columns";

// --- Helper function to determine media type ---
type MediaType = "image" | "video" | "other" | "invalid";

const getMediaType = (url: string): MediaType => {
  if (!url || typeof url !== "string") return "invalid";
  const lowerUrl = url.toLowerCase();

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
  ];
  if (imageExtensions.some((ext) => lowerUrl.endsWith(ext))) {
    return "image";
  }

  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  if (videoExtensions.some((ext) => lowerUrl.endsWith(ext))) {
    return "video";
  }

  if (
    lowerUrl.includes("youtube.com/watch?v=") ||
    lowerUrl.includes("youtu.be/")
  ) {
    return "video";
  }
  if (lowerUrl.includes("vimeo.com/")) {
    return "video";
  }

  try {
    new URL(url);
    return "other";
  } catch {
    return "invalid";
  }
};
// ----------------------------------------------

// Types for form inputs
type DescriptionBlock = {
  id: string; // Unique ID for each block (UI use only)
  title: string;
  body: string;
};

type ColorOptionItem = { id: string; name: string; code: string };
type DropdownOptionItem = { id: string; value: string };

type ProductOptionGroup = {
  id: string; // For React list keys
  name: string; // Ex: "Color", "Size", "Design"
  optionType: "none" | "drop_down" | "color" | "json";
  colorOptions: ColorOptionItem[];
  dropdownOptions: DropdownOptionItem[];
  includeDependingOnYourLuck: boolean;
  jsonInput: string;
};

// --- NEW FUNCTION: Generate SKU from Name ---
const generateSkuFromName = (name: string): string => {
  if (!name) return "";
  const cleanedName = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .trim();
  const timestamp = Date.now().toString().slice(-6);
  return `${cleanedName.slice(0, 20)}-${timestamp}`;
};
// -----------------------------------------------------------

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  // --- États pour les champs du formulaire, avec des valeurs par défaut pour l'édition ---
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState(0);
  const [type, setType] = useState<"Digital" | "Physical">("Physical");
  const [instantDelivery, setInstantDelivery] = useState(false);
  const [published, setPublished] = useState(true);

  const [currency, setCurrency] = useState("MAD");
  const [price, setPrice] = useState<number>(0);
  const [discountPercentage, setDiscountPercentage] = useState<
    number | undefined
  >(undefined);
  const [pricePerUnit, setPricePerUnit] = useState<number | undefined>(
    undefined
  );

  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [currentMediaUrl, setCurrentMediaUrl] = useState("");
  const [descriptionBlocks, setDescriptionBlocks] = useState<
    DescriptionBlock[]
  >([]);
  const [categories, setCategories] = useState<string>("");
  const [tags, setTags] = useState<string>("");

  const [productOptionGroups, setProductOptionGroups] = useState<
    ProductOptionGroup[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calcule dynamiquement le prix réduit
  const discountedPrice = useMemo(() => {
    if (
      price > 0 &&
      discountPercentage !== undefined &&
      discountPercentage > 0 &&
      discountPercentage <= 100
    ) {
      return price * (1 - discountPercentage / 100);
    }
    return undefined;
  }, [price, discountPercentage]);

  // --- Hook pour charger les données du produit à éditer ---
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        console.error("No product ID found in URL parameters.");
        setIsLoading(false);
        return;
      }

      console.log(`Fetching product with ID: ${productId}`);
      setIsLoading(true);

      try {
        const response = await fetch(`/api/products/${productId}`);
        console.log("API response status:", response.status);
        if (!response.ok) {
          throw new Error("Failed to fetch product data.");
        }
        const productData: Product = await response.json();
        console.log("Product data fetched successfully:", productData);

        // Populate state with fetched data
        setName(productData.name);
        setSlug(productData.slug);
        setShortDescription(productData.shortDescription || "");
        setSku(productData.sku);
        setStock(productData.stock);
        setType(productData.type);
        setInstantDelivery(productData.instantDelivery);
        setPublished(productData.published);
        setCurrency(productData.priceData.currency);
        setPrice(parseFloat(productData.priceData.price.toFixed()));
        if (productData.priceData.discountedPrice) {
          const calculatedDiscount =
            (1 -
              parseFloat(productData.priceData.discountedPrice.toFixed()) /
                parseFloat(productData.priceData.price.toFixed())) *
            100;
          setDiscountPercentage(calculatedDiscount);
        }
        if (productData.priceData.pricePerUnit) {
          setPricePerUnit(
            parseFloat(productData.priceData.pricePerUnit.toFixed())
          );
        }
        setMediaUrls(productData.mediaUrls || []);
        setDescriptionBlocks(
          productData.description
            ? productData.description.map((block: any) => ({
                ...block,
                id: generateSkuFromName(block.title),
              }))
            : []
        );
        setCategories(productData.categories.join(", "));
        setTags(productData.tags.join(", "));
        // --- Populating Product Options ---
        const populatedOptions = productData.productOptions.map(
          (group: any) => {
            let colorOptions: ColorOptionItem[] = [];
            let dropdownOptions: DropdownOptionItem[] = [];
            let jsonInput = "";
            let includeDependingOnYourLuck = false;

            if (group.optionType === "color") {
              colorOptions = Object.entries(group.choices).map(
                ([name, code]: any) => ({
                  id: generateSkuFromName(name),
                  name,
                  code,
                })
              );
            } else if (group.optionType === "drop_down") {
              const luckIndex = group.choices.indexOf("Depends on Your Luck");
              if (luckIndex !== -1) {
                includeDependingOnYourLuck = true;
                group.choices.splice(luckIndex, 1);
              }
              dropdownOptions = group.choices.map((value: string) => ({
                id: generateSkuFromName(value),
                value,
              }));
            } else if (group.optionType === "json") {
              jsonInput = JSON.stringify(group.choices, null, 2);
            }

            return {
              id: generateSkuFromName(group.name),
              name: group.name,
              optionType: group.optionType,
              colorOptions,
              dropdownOptions,
              includeDependingOnYourLuck,
              jsonInput,
            };
          }
        );
        setProductOptionGroups(populatedOptions);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error(
          "Failed to load product data. Check the console for details."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);
  // -------------------------------------------------------------

  const handleAddOptionGroup = () => {
    setProductOptionGroups((prevGroups) => [
      ...prevGroups,
      {
        id: Date.now().toString(),
        name: "",
        optionType: "none",
        colorOptions: [],
        dropdownOptions: [],
        includeDependingOnYourLuck: false,
        jsonInput: "",
      },
    ]);
  };

  const handleRemoveOptionGroup = (idToRemove: string) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.filter((group) => group.id !== idToRemove)
    );
  };

  const handleOptionGroupNameChange = (id: string, newName: string) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === id ? { ...group, name: newName } : group
      )
    );
  };

  const handleOptionTypeChange = (
    id: string,
    newType: "none" | "drop_down" | "color" | "json"
  ) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === id) {
          return {
            ...group,
            optionType: newType,
            colorOptions: [],
            dropdownOptions: [],
            includeDependingOnYourLuck: false,
            jsonInput: "",
          };
        }
        return group;
      })
    );
  };

  const handleAddColorOption = (groupId: string) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              colorOptions: [
                ...group.colorOptions,
                { id: Date.now().toString(), name: "", code: "" },
              ],
            }
          : group
      )
    );
  };

  const handleColorOptionChange = (
    groupId: string,
    optionId: string,
    field: "name" | "code",
    value: string
  ) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              colorOptions: group.colorOptions.map((opt) =>
                opt.id === optionId ? { ...opt, [field]: value } : opt
              ),
            }
          : group
      )
    );
  };

  const handleRemoveColorOption = (groupId: string, optionId: string) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              colorOptions: group.colorOptions.filter(
                (opt) => opt.id !== optionId
              ),
            }
          : group
      )
    );
  };

  const handleAddDropdownOption = (groupId: string) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              dropdownOptions: [
                ...group.dropdownOptions,
                { id: Date.now().toString(), value: "" },
              ],
            }
          : group
      )
    );
  };

  const handleDropdownOptionChange = (
    groupId: string,
    optionId: string,
    value: string
  ) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              dropdownOptions: group.dropdownOptions.map((opt) =>
                opt.id === optionId ? { ...opt, value: value } : opt
              ),
            }
          : group
      )
    );
  };

  const handleRemoveDropdownOption = (groupId: string, optionId: string) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              dropdownOptions: group.dropdownOptions.filter(
                (opt) => opt.id !== optionId
              ),
            }
          : group
      )
    );
  };

  const handleIncludeDependingOnYourLuckChange = (
    groupId: string,
    checked: boolean
  ) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? { ...group, includeDependingOnYourLuck: checked }
          : group
      )
    );
  };

  const handleJsonInputChange = (groupId: string, value: string) => {
    setProductOptionGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId ? { ...group, jsonInput: value } : group
      )
    );
  };

  const handleAddMediaUrl = () => {
    if (currentMediaUrl.trim() !== "") {
      setMediaUrls([...mediaUrls, currentMediaUrl.trim()]);
      setCurrentMediaUrl("");
    }
  };

  const handleRemoveMediaUrl = (index: number) => {
    const newMediaUrls = mediaUrls.filter((_, i) => i !== index);
    setMediaUrls(newMediaUrls);
  };

  const handleAddBlock = () => {
    setDescriptionBlocks([
      ...descriptionBlocks,
      { id: Date.now().toString(), title: "", body: "" },
    ]);
  };

  const handleBlockTitleChange = (id: string, value: string) => {
    setDescriptionBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === id ? { ...block, title: value } : block
      )
    );
  };

  const handleBlockBodyChange = useCallback((id: string, html: string) => {
    setDescriptionBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === id ? { ...block, body: html } : block
      )
    );
  }, []);

  const handleRemoveBlock = (idToRemove: string) => {
    setDescriptionBlocks((prevBlocks) =>
      prevBlocks.filter((block) => block.id !== idToRemove)
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsedCategories = categories
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) => cat.length > 0);
    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const finalProductOptions = productOptionGroups
      .map((group) => {
        let choicesData: any = {};
        let isValid = true;

        if (!group.name.trim()) {
          toast.error(
            `Option group name cannot be empty for option type "${group.optionType}".`
          );
          isValid = false;
        }

        if (group.optionType === "color") {
          const colorsMap: { [key: string]: string } = {};
          group.colorOptions.forEach((color) => {
            if (color.name.trim() && color.code.trim()) {
              colorsMap[color.name.trim()] = color.code.trim();
            }
          });
          if (Object.keys(colorsMap).length === 0) {
            toast.error(
              `Color options must have at least one valid color name and code for "${group.name}".`
            );
            isValid = false;
          }
          choicesData = colorsMap;
        } else if (group.optionType === "drop_down") {
          const dropDownValues: string[] = group.dropdownOptions
            .map((opt) => opt.value.trim())
            .filter((val) => val.length > 0);

          if (group.includeDependingOnYourLuck) {
            dropDownValues.push("Depends on Your Luck");
          }
          if (dropDownValues.length === 0) {
            toast.error(
              `Dropdown options must have at least one value for "${group.name}".`
            );
            isValid = false;
          }
          choicesData = dropDownValues;
        } else if (group.optionType === "json") {
          if (group.jsonInput.trim() !== "") {
            try {
              choicesData = JSON.parse(group.jsonInput);
              if (typeof choicesData !== "object" || choicesData === null) {
                toast.error(
                  `JSON for "${group.name}" must be an object or an array.`
                );
                isValid = false;
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
              toast.error(
                `Invalid JSON format for option group "${group.name}".`
              );
              isValid = false;
            }
          } else {
            choicesData = {};
          }
        }
        if (!isValid) return null;

        return {
          name: group.name.trim(),
          optionType: group.optionType,
          choices: choicesData,
        };
      })
      .filter(Boolean);

    if (finalProductOptions.length === 0 && productOptionGroups.length > 0) {
      toast.error(
        "Please correct errors in product options or remove empty option groups."
      );
      return;
    }

    const productPriceData = {
      currency,
      price: price,
      ...(discountedPrice !== undefined && {
        discountedPrice: discountedPrice,
      }),
      ...(pricePerUnit !== undefined && { pricePerUnit: pricePerUnit }),
    };

    const filteredDescriptionBlocks = descriptionBlocks.filter(
      (block) => block.title.trim() !== "" || block.body.trim() !== ""
    );
    if (filteredDescriptionBlocks.length === 0) {
      toast.error("Please add at least one description block.");
      return;
    }

    const updatedProduct = {
      name,
      slug:
        slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      shortDescription,
      sku,
      stock: Number(stock),
      type,
      instantDelivery,
      priceData: productPriceData,
      mediaUrls,
      published,
      description: filteredDescriptionBlocks.map(({ id, ...rest }) => rest),
      categories: parsedCategories,
      tags: parsedTags,
      productOptions: finalProductOptions,
    };

    try {
      // --- MODIFIÉ: Appel API PUT pour la mise à jour ---
      const response = await axios.put(
        `/api/products/${productId}`,
        updatedProduct
      );

      if (response.status !== 200) {
        const errorData = await response.data;
        throw new Error(errorData.message || "Failed to update product.");
      }

      toast.success("Product updated successfully!");
      router.push("/dashboard/products");
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error(
        error.message || "An error occurred while updating the product."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-semibold">Chargement du produit...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Edit Product: {name}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <Label htmlFor="name" className="mb-2 block">
            Product Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="slug" className="mb-2 block">
            Slug (URL - Auto-generated if empty)
          </Label>
          <Input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={name
              .toLowerCase()
              .replace(/[^a-z0-9-]+/g, "-")
              .replace(/^-+|-+$/g, "")}
          />
        </div>
        <div>
          <Label htmlFor="shortDescription" className="mb-2 block">
            Short Description
          </Label>
          <Input
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sku" className="mb-2 block">
            SKU (Base Product)
          </Label>
          <Input
            id="sku"
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="stock" className="mb-2 block">
            Stock (Base Product)
          </Label>
          <Input
            id="stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            required
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="type" className="mb-2 block">
            Product Type
          </Label>
          <Select
            onValueChange={(value: "Digital" | "Physical") => setType(value)}
            defaultValue={type}
            value={type}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Physical">Physical</SelectItem>
              <SelectItem value="Digital">Digital</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="instantDelivery"
            checked={instantDelivery}
            onCheckedChange={(checked: boolean) => setInstantDelivery(checked)}
          />
          <Label htmlFor="instantDelivery">
            Instant Delivery (for digital products)
          </Label>
        </div>

        {/* Price Data Section */}
        <div className="border p-4 rounded-md space-y-4">
          <h3 className="text-xl font-semibold mb-3">Price Data</h3>
          <div>
            <Label htmlFor="currency" className="mb-2 block">
              Currency
            </Label>
            <Select
              onValueChange={setCurrency}
              defaultValue={currency}
              value={currency}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAD">MAD (Moroccan Dirham)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="price" className="mb-2 block">
              Price (Base)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              required
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="discountPercentage" className="mb-2 block">
              Discount Percentage (Optional)
            </Label>
            <Input
              id="discountPercentage"
              type="number"
              step="0.01"
              value={discountPercentage === undefined ? "" : discountPercentage}
              onChange={(e) =>
                setDiscountPercentage(parseFloat(e.target.value) || undefined)
              }
              min="0"
              max="100"
            />
          </div>
          {discountedPrice !== undefined && (
            <div className="text-sm text-gray-600">
              Calculated Discounted Price:{" "}
              <span className="font-semibold">
                {discountedPrice.toFixed(2)} {currency}
              </span>
            </div>
          )}
          <div>
            <Label htmlFor="pricePerUnit" className="mb-2 block">
              Price per Unit (Optional)
            </Label>
            <Input
              id="pricePerUnit"
              type="number"
              step="0.01"
              value={pricePerUnit === undefined ? "" : pricePerUnit}
              onChange={(e) =>
                setPricePerUnit(parseFloat(e.target.value) || undefined)
              }
              min="0"
            />
          </div>
        </div>

        {/* Description Section (Rich Text Blocks) */}
        <div className="border p-4 rounded-md space-y-4">
          <h3 className="text-xl font-semibold mb-3">
            Full Description (Rich Text Blocks)
          </h3>
          {descriptionBlocks.map((block) => (
            <div
              key={block.id}
              className="border p-3 rounded-md bg-gray-50 relative"
            >
              <Label htmlFor={`block-title-${block.id}`} className="mb-2 block">
                Block Title
              </Label>
              <Input
                id={`block-title-${block.id}`}
                type="text"
                value={block.title}
                onChange={(e) =>
                  handleBlockTitleChange(block.id, e.target.value)
                }
                required
                className="mb-2"
              />
              <Label htmlFor={`block-body-${block.id}`} className="mb-2 block">
                Block Body (Rich Text)
              </Label>
              <TipTapEditorWrapper
                id={`tiptap-editor-${block.id}`}
                value={block.body}
                onChange={(html) => handleBlockBodyChange(block.id, html)}
              />
              {descriptionBlocks.length > 1 && (
                <Button
                  type="button"
                  onClick={() => handleRemoveBlock(block.id)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  X
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            onClick={handleAddBlock}
            variant="outline"
            className="w-full"
          >
            Add description block
          </Button>
        </div>

        {/* Media URLs Section (Images/Videos) - MODIFIED FOR PREVIEW */}
        <div className="border p-4 rounded-md space-y-4">
          <h3 className="text-xl font-semibold mb-3">
            Media URLs (Images/Videos)
          </h3>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Add image or video URL"
              value={currentMediaUrl}
              onChange={(e) => setCurrentMediaUrl(e.target.value)}
            />
            <Button type="button" onClick={handleAddMediaUrl}>
              Add
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaUrls.map((url, index) => {
              const mediaType = getMediaType(url);
              return (
                <div
                  key={index}
                  className="relative group border rounded-md overflow-hidden bg-gray-100 flex flex-col"
                >
                  <div className="relative w-full h-32 flex items-center justify-center bg-gray-200 overflow-hidden">
                    {mediaType === "image" && (
                      <Image
                        src={url}
                        width={250}
                        height={250}
                        alt={`Media preview ${index + 1}`}
                        className="object-contain w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/150?text=Image+Load+Error";
                          e.currentTarget.alt = "Image load error";
                        }}
                      />
                    )}
                    {mediaType === "video" && (
                      <video
                        src={url}
                        controls
                        className="object-contain w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = "";
                          toast.error(`Failed to load video: ${url}`);
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                    {mediaType === "other" && (
                      <div className="text-center text-gray-500 text-sm p-2">
                        <p>No preview available for this URL type.</p>
                        <p className="break-all text-xs text-gray-400">{url}</p>
                      </div>
                    )}
                    {mediaType === "invalid" && (
                      <div className="text-center text-red-500 text-sm p-2">
                        <p>Invalid URL format.</p>
                        <p className="break-all text-xs text-red-400">{url}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-xs flex justify-between items-center bg-white border-t">
                    <span className="truncate flex-1 font-medium">
                      Type: {mediaType}
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleRemoveMediaUrl(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700 p-1 h-auto"
                      title="Remove URL"
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 p-2 break-all">{url}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories and Tags Section */}
        <div className="border p-4 rounded-md space-y-4">
          <h3 className="text-xl font-semibold mb-3">Categories and Tags</h3>
          <div>
            <Label htmlFor="categories" className="mb-2 block">
              Categories (comma-separated)
            </Label>
            <Input
              id="categories"
              type="text"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="Ex: Electronics, Smartphones, New Arrivals"
            />
          </div>
          <div>
            <Label htmlFor="tags" className="mb-2 block">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: promo, top-selling, 2024"
            />
          </div>
        </div>

        {/* Product Options (Multiple Groups) */}
        <div className="border p-4 rounded-md space-y-4">
          <h3 className="text-xl font-semibold mb-3">Product Options</h3>

          {productOptionGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              className="border p-4 rounded-md bg-gray-50 relative space-y-3"
            >
              <h4 className="text-lg font-medium mb-2">
                Option Group #{groupIndex + 1}
              </h4>
              <Button
                type="button"
                onClick={() => handleRemoveOptionGroup(group.id)}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
              >
                X
              </Button>

              <div>
                <Label
                  htmlFor={`group-name-${group.id}`}
                  className="mb-1 block"
                >
                  Option Group Name
                </Label>
                <Input
                  id={`group-name-${group.id}`}
                  type="text"
                  value={group.name}
                  onChange={(e) =>
                    handleOptionGroupNameChange(group.id, e.target.value)
                  }
                  placeholder="Ex: Color, Size, Material"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor={`option-type-${group.id}`}
                  className="mb-1 block"
                >
                  Option Type
                </Label>
                <Select
                  onValueChange={(
                    value: "none" | "drop_down" | "color" | "json"
                  ) => handleOptionTypeChange(group.id, value)}
                  value={group.optionType}
                >
                  <SelectTrigger id={`option-type-${group.id}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      None (No special options)
                    </SelectItem>
                    <SelectItem value="color">
                      Color Map (Name {"->"} Hex Code)
                    </SelectItem>
                    <SelectItem value="drop_down">
                      Dropdown List (Values)
                    </SelectItem>
                    <SelectItem value="json">
                      Arbitrary JSON (Advanced)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {group.optionType === "color" && (
                <div className="space-y-3 border p-3 rounded-md bg-white">
                  <p className="text-sm text-gray-600">
                    Define color names and their corresponding hex codes.
                  </p>
                  {group.colorOptions.map((colorOpt) => (
                    <div key={colorOpt.id} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label
                          htmlFor={`color-name-${group.id}-${colorOpt.id}`}
                          className="mb-1 block text-xs"
                        >
                          Color Name
                        </Label>
                        <Input
                          id={`color-name-${group.id}-${colorOpt.id}`}
                          type="text"
                          value={colorOpt.name}
                          onChange={(e) =>
                            handleColorOptionChange(
                              group.id,
                              colorOpt.id,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="Ex: Red"
                        />
                      </div>
                      <div className="flex-1">
                        <Label
                          htmlFor={`color-code-${group.id}-${colorOpt.id}`}
                          className="mb-1 block text-xs"
                        >
                          Color Code
                        </Label>
                        <Input
                          id={`color-code-${group.id}-${colorOpt.id}`}
                          type="text"
                          value={colorOpt.code}
                          onChange={(e) =>
                            handleColorOptionChange(
                              group.id,
                              colorOpt.id,
                              "code",
                              e.target.value
                            )
                          }
                          placeholder="#FF0000"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() =>
                          handleRemoveColorOption(group.id, colorOpt.id)
                        }
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                      >
                        X
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() => handleAddColorOption(group.id)}
                    variant="outline"
                    className="w-full"
                  >
                    Add Color Option
                  </Button>
                </div>
              )}

              {group.optionType === "drop_down" && (
                <div className="space-y-3 border p-3 rounded-md bg-white">
                  <p className="text-sm text-gray-600">
                    Define values for the dropdown list.
                  </p>
                  {group.dropdownOptions.map((dropdownOpt) => (
                    <div key={dropdownOpt.id} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label
                          htmlFor={`dropdown-value-${group.id}-${dropdownOpt.id}`}
                          className="mb-1 block text-xs"
                        >
                          Option Value
                        </Label>
                        <Input
                          id={`dropdown-value-${group.id}-${dropdownOpt.id}`}
                          type="text"
                          value={dropdownOpt.value}
                          onChange={(e) =>
                            handleDropdownOptionChange(
                              group.id,
                              dropdownOpt.id,
                              e.target.value
                            )
                          }
                          placeholder="Ex: Small, Medium, Large"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() =>
                          handleRemoveDropdownOption(group.id, dropdownOpt.id)
                        }
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                      >
                        X
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() => handleAddDropdownOption(group.id)}
                    variant="outline"
                    className="w-full mb-3"
                  >
                    Add Dropdown Option
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`dependingOnYourLuck-${group.id}`}
                      checked={group.includeDependingOnYourLuck}
                      onCheckedChange={(checked: boolean) =>
                        handleIncludeDependingOnYourLuckChange(
                          group.id,
                          checked
                        )
                      }
                    />
                    <Label htmlFor={`dependingOnYourLuck-${group.id}`}>
                      Add {'"Depends on Your Luck"'} to list
                    </Label>
                  </div>
                </div>
              )}

              {group.optionType === "json" && (
                <div className="space-y-3 border p-3 rounded-md bg-white">
                  <Label
                    htmlFor={`json-input-${group.id}`}
                    className="mb-2 block"
                  >
                    Arbitrary Options (JSON)
                  </Label>
                  <Textarea
                    id={`json-input-${group.id}`}
                    value={group.jsonInput}
                    onChange={(e) =>
                      handleJsonInputChange(group.id, e.target.value)
                    }
                    rows={4}
                    placeholder='Ex: {"material": "wood", "dimensions": {"length": "10cm"}}'
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Enter any additional options for this group in valid JSON
                    format.
                  </p>
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            onClick={handleAddOptionGroup}
            variant="outline"
            className="w-full"
          >
            Add Another Product Option Group
          </Button>
        </div>

        {/* Published Field */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="published"
            checked={published}
            onCheckedChange={(checked: boolean) => setPublished(checked)}
          />
          <Label htmlFor="published">Publish product</Label>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full">
          Update Product
        </Button>
      </form>
    </div>
  );
}
