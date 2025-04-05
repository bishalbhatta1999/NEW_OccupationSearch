import Stripe from 'stripe'; // Import Stripe using ES module syntax
import 'dotenv/config';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY); // Replace with your Stripe secret key

const listProductsWithPrices = async () => {
  try {
    // Fetch the list of products
    const products = await stripe.products.list({
      limit: 100, // You can adjust the limit as needed
    });

    // Log the number of products
    console.log(`Number of products: ${products.data.length}`);

    // Loop through the products
    for (const product of products.data) {
      console.log(`Product ID: ${product.id}, Name: ${product.name}`);
      
      // Fetch the prices for the current product
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 10, // You can adjust the limit if needed
      });

      // Loop through the prices and log the price ID
      prices.data.forEach((price) => {
        console.log(`  Price ID: ${price.id}, Unit Amount: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
      });
    }
  } catch (error) {
    console.error('Error retrieving products and prices:', error);
  }
};

// Run the function to list products with price IDs
listProductsWithPrices();
