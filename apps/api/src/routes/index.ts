import { Router } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "./auth.routes.js";
import categoryRouter from "./category.routes.js";
import productRouter from "./product.routes.js";
import taxonomyRouter from "./taxonomy.routes.js";
import cartRouter from "./cart.routes.js";
import wishlistRouter from "./wishlist.routes.js";
import inventoryRouter from "./inventory.routes.js";
import orderRouter from "./order.routes.js";
import adminRouter from "./admin.routes.js";
import couponRouter from "./coupon.routes.js";
import reviewRouter from "./review.routes.js";
import userRouter from "./user.routes.js";
import uploadRouter from "./upload.routes.js";
import heroRouter from "./hero.routes.js";
import storeSettingsRouter from "./store-settings.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/taxonomies", taxonomyRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/wishlist", wishlistRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/coupons", couponRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/upload", uploadRouter);
apiRouter.use("/hero", heroRouter);
apiRouter.use("/store-settings", storeSettingsRouter);

export default apiRouter;
