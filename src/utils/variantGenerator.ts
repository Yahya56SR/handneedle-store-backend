/* eslint-disable @typescript-eslint/no-explicit-any */
function generateVariants(
  productOptions: { [key: string]: string[] },
  baseSku: string,
  baseStock: number
): any[] {
  const optionKeys = Object.keys(productOptions);
  if (optionKeys.length === 0) {
    return [];
  }

  const combinations: { [key: string]: string }[][] = [];

  function generateCombinationsRecursive(
    index: number,
    currentCombination: { name: string; value: string }[]
  ) {
    if (index === optionKeys.length) {
      combinations.push([...currentCombination]);
      return;
    }

    const currentOptionName = optionKeys[index];
    const currentOptionValues = productOptions[currentOptionName];

    for (const value of currentOptionValues) {
      currentCombination.push({ name: currentOptionName, value: value });
      generateCombinationsRecursive(index + 1, currentCombination);
      currentCombination.pop();
    }
  }

  generateCombinationsRecursive(0, []);

  const variants = combinations.map((combination) => {
    const skuSuffix = combination
      .map((opt) => opt.value.replace(/\s+/g, "-").toUpperCase())
      .join("-");
    return {
      sku: `${baseSku}-${skuSuffix}`,
      options: combination,
      priceAdjustment: 0,
      stock: baseStock,
    };
  });

  return variants;
}

export default generateVariants;
