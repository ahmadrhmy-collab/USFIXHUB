import { notFound } from "next/navigation"

import { FadeIn } from "@/components/cult/fade-in"
import { getProductById } from "@/app/actions/product"

import { ProductDetails } from "./details"

const ProductIdPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params
  const data = await getProductById(slug)

  if (!data?.length) {
    notFound()
  }

  return (
    <>
      <div className="z-10">
        <div className=" py-4 w-full relative  mx-auto max-w-6xl">
          <FadeIn>{data ? <ProductDetails product={data[0]} /> : null}</FadeIn>
        </div>
      </div>
    </>
  )
}

export default ProductIdPage
