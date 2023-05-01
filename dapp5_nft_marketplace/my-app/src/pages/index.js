import { ethers } from "ethers";
import { useState, useEffect } from "react"
import axios from "axios";
import Web3modal from "web3modal"
import { contractAddress, INFURA_URL } from "../../config"
import ABI from "../abi/MarketToken.json"
import Image from "next/image";

export default function Home() {
  const [nfts, loadNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNft();

  }, [])



  const loadNft = async () => {
    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
    const contract = new ethers.Contract(contractAddress, ABI.abi, provider);
    const data = await contract.fetchMarketItems();
    const items =await Promise.all (data.map(async (i) => {
      const id = i.tokenId;
      const tokenUri = await contract.tokenURI(id);
      let metadata = await axios.get(tokenUri);
      // console.log(tokenUri);
      metadata=metadata.data.pinataMetdata.pinataContent;
      // console.log(metadata.image);
      let price = ethers.utils.formatUnits(i.price.toString(),"ether");
      let item = {
        price:price,
        tokenId: id,
        seller: i.seller,
        owner: i.owner,
        image: metadata.image,
        description: metadata.description
      }
      return item;
    }))
    loadNfts(items);
    setLoading(false);
  }

  const buyNft = async (nft) => {
    const web3modal = new Web3modal();
    const connection = await web3modal.connect();
    const provider = await new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    const getNetwork = await provider.getNetwork();
    if ((await getNetwork).chainId != 11155111) {
      alert("you not connected with sepolia network");
      return;
    }
    const contract = await new ethers.Contract(contractAddress, ABI.abi, signer);
    const price = ethers.utils.parseUnits(nft.price.toString(),'ether');
    // console.log(price)
    // price=parseInt(price);
    const transaction = await contract.buyNFT(nft.tokenId, { value: price });
    await transaction.wait();
    loadNft();
  }








  if (loading) {
    return (
      <h1 className="px-20 py-10 text-3xl">Please wait for a munite
        <br />
        I am doing mylunch
      </h1>
    )
  }
  if (!loading && nfts.length == 0) {
    return (
      <h1 className="px-20 py-10 text-3xl">No NFTs in the Market Place</h1>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-4">
          {
            nfts.map((nft, i) => (
               (<div key={i} className="border shadow rounded-xl overflow-hidden m-3">
                <Image  src={nft.image} alt=""  width={300} height={200} style={{width:'100px',height:'100px'}} placeholder="blur" blurDataURL="#" layout="responsive" />
                <div className="p-4">
                  <p style={{ height: "15px" }} className="text-2xl font-semibold">{nft.name}</p>
                  <div className="text-grey-400">{nft.description}</div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price}</p>
                  <button className="w-full bg-orange-400 text-white font-bold py-2 px-12 rounded" onClick={()=>{
                    buyNft(nft)
                  }}>But Now</button>
                </div>
              </div>)
            ))
          }
        </div>
      </div>

    </div>
  )
}