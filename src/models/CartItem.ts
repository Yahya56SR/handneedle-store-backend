interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number; // Prix au moment de l'ajout au panier
  quantity: number;
  options?: { [key: string]: string }; // Si tes produits ont des options (taille, couleur, etc.)
}

export default CartItem;
