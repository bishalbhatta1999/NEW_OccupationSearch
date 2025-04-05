import Stripe from 'stripe'; // ES module import
import 'dotenv/config';
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);  // Replace with your Stripe secret key

const subscriptionPlans = [
  {
    id: 'Standard',
    name: 'Standard',
    description: 'Ideal for growing migration agencies',
    prices: [
      { amount: 2900, billingPeriod: 'month' },  // Monthly plan in cents ($29)
      { amount: 29000, billingPeriod: 'year' }   // Annual plan in cents ($299)
    ]
  },
  {
    id: 'Premium',
    name: 'Premium',
    description: 'Perfect for individuals and small businesses',
    prices: [
      { amount: 7900, billingPeriod: 'month' },   // Monthly plan
      { amount: 79000, billingPeriod: 'year' }     // Annual plan
    ]
  },
  
  {
    id: 'Enterprise',
    name: 'Enterprise',
    description: 'For large organizations with advanced needs',
    prices: [
      { amount: 9900, billingPeriod: 'month' },  // Monthly plan in cents ($99)
      { amount: 99000, billingPeriod: 'year' }   // Annual plan in cents ($999)
    ]
  }
];

const createProductsAndPrices = async () => {
  try {
    for (const plan of subscriptionPlans) {
      // Create Product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description
      });

      console.log(`Product created: ${product.id} - ${plan.name}`);

      // Create Prices for each billing period (monthly and yearly)
      for (const priceData of plan.prices) {
        const price = await stripe.prices.create({
          unit_amount: priceData.amount,
          currency: 'usd',
          recurring: {
            interval: priceData.billingPeriod
          },
          product: product.id,
        });

        console.log(`Price created for ${plan.name} (${priceData.billingPeriod}): ${price.id}`);
      }
    }

    console.log("Products and Prices created successfully!");
  } catch (error) {
    console.error('Error creating products and prices:', error);
  }
};

// Call the function
createProductsAndPrices();
