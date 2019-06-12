import React, { Component } from 'react';
import MobileDetect from 'mobile-detect';
import {Statistic, Divider, Grid, Responsive, Table, Message, Rating, Icon, Button} from 'semantic-ui-react';
import { ethers } from 'ethers';
import factory from '../ethereum/factory';
import Rental from '../ethereum/rental';
import Profile from '../ethereum/profile';
import Layout from '../components/Layout';
import { getWidthFactory } from '../utils/device';
import { convertToImage, getString } from '../utils/ipfs';
import { Link, Router } from '../routes';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import RentalShow from './rents/show';
import moment, { now } from 'moment';
import web3 from '../ethereum/web3';

async function getSumMatching(filterArray, rent){
    let i, j;
    const summary =await Rental(rent).methods.getSummary().call();

    let sum = summary[0].concat(" ",(await getString('Qm'+summary[1]))).toLowerCase();
    let arraySum = sum.split(" ");
    console.log(arraySum);
    let  occurences = 0;
    for (i=0;i<filterArray.length;i++){
        for (j=0;j<arraySum.length;j++){
            if (filterArray[i]===arraySum[j]) occurences++;
        }
    }
    console.log(occurences);
    return occurences;
}

async function search(value, rents){
    let array = value.toLowerCase().split(" ");
    let i;
    let filterArray = [];
    for (i=0;i<array.length;i++){
        if (array[i]!='') filterArray.push(array[i]);
    } 

    let arrayOccurences = [];
    for (i=0;i<rents.length;i++){
        arrayOccurences.push([await getSumMatching(filterArray,rents[i]),rents[i]]);
    }

    console.log(arrayOccurences);

    arrayOccurences.sort((a,b)=>{return (b[0]-a[0])});
    let limit;
    if (rents.length>1) limit= 1;
    else limit= rents.length;
    let result = [];
    for (i=0;i<limit;i++){
        result.push(arrayOccurences[i][1]);
    }

    return result;
}

class RentalIndex extends Component {
    state = {
        loadingShareToken: false,
        disabledShareToken: false,
        didShareToken: false
    }

    static async getInitialProps(props) { 
        let {req} = props;
        let searchItem = decodeURIComponent(props.query.value);
        const deployedRents = await factory.methods.getDeployedRentals().call();
        // const status = await Promise.all(
        //         deployedRents
        //         .map((address) => {
        //         return Rental(address).methods.getState().call();
        //     })
        // );

        const availableRents = await search(searchItem,deployedRents);
        //.filter((address, i) => 
            //status[i] == "PUBLISHED"
        //);


        let names = [];
        let owners = [];
        let deposit = [];
        let rentalFee = [];

        const summary = await Promise.all(
                availableRents
                .map((address) => {
                    return Rental(address).methods.getSummary().call();
                })  
        );
        
        summary.forEach(function(item){
            names.push(item[0]);
            owners.push(item[5]);
            deposit.push(item[3]);
            rentalFee.push(item[2]);

        });

        /**********************************************/
        const isOverDue = await Promise.all(
            availableRents.map((address)=>{
                return Rental(address).methods.isOverdue().call();
            })
        );
        /**********************************************/

        const timeArray = await Promise.all(
            availableRents.map((address)=>{
                return Rental(address).methods.getTime().call();
            })
        );
        
        const answererList = await Promise.all(
            availableRents.map((address)=>{
                return Rental(address).methods.getAnswerList().call();
            })
        );

        const shareToken = await Promise.all(
            availableRents.map((address)=>{
                return Rental(address).methods.getCheckShareToken().call();
            })
        )
        // const deposit2 = await Promise.all(
        //         availableRents
        //         .map((address) => {
        //         return Rental(address).methods.deposit().call();;
        //     })
        // );

        
        // const ownersP = await Promise.all(
        //         owners
        //         .map((owner) => {
        //         return factory.methods.getProfile(owner).call();;
        //     })
        // );

        // const itemSumRatings = await Promise.all(
        //         ownersP
        //         .map((ownerP) => {
        //         return Profile(ownerP).methods.getSumRating().call();;
        //     })
        // );

        // const ratingCounts = await Promise.all(
        //         ownersP
        //         .map((ownerP) => {
        //         return Profile(ownerP).methods.ratingCounts().call();;
        //     })
        // );

        const questionRating = await Promise.all(
            availableRents
            .map((address) => {
                return Rental(address).methods.returnRatingQuestion().call();
            })
        );

        // const imageHashes = await Promise.all(
        //         availableRents
        //         .map((address) => {
        //         return Rental(address).methods.imageHashes().call();
        //     })
        // );

        // const images = await Promise.all(
        //         imageHashes
        //         .map((hash) => {
        //         return hash == '0' ? 
        //             'https://react.semantic-ui.com/images/wireframe/white-image.png' 
        //             : convertToImage('Qm' + hash);
        //     })
        // );

        let isMobileFromSSR = false;

        if(req){
            const device = req.headers["user-agent"];
            const md = new MobileDetect(device);
            isMobileFromSSR = !!md.mobile();
        }

        return { deployedRents, availableRents, names, deposit, rentalFee,
                 isMobileFromSSR, timeArray, answererList, questionRating, 
                 isOverDue,
                  shareToken, searchItem };
    }

    shareToken = async(event, address) =>{
        event.preventDefault();
        console.log("Start");
        console.log(address);

        this.setState({ loadingShareToken: true})
        const accounts = await web3.eth.getAccounts();
        await factory.methods.shareTokenAt(address).send({
            from: accounts[0],
        });

        const rental = Rental(address);
        const tokenSum = await rental.methods.getSumToken().call();
        const numPeople = await rental.methods.getNumPeople().call();
        const answererList = await rental.methods.getAnswerList().call();
        const deposit = await rental.methods.getDeposit().call();
        const rate = await rental.methods.returnRatingQuestion().call();
        console.log(rate);
        console.log(tokenSum);
        console.log('numPeople: '+numPeople);
        console.log(answererList);
        console.log(deposit);

        this.setState({ loadingShareToken: false, 
                        disabledShareToken: true
                    });
        console.log("Share!!!");
    }

    renderRentsDesktop() {
        //console.log(this.props.searchItem);
        const items = this.props.availableRents.map((address, i) => {
            const deposit = ethers.utils.formatUnits(this.props.deposit[i], "ether")*1000000000000000000;
            //const deposit = this.props.deposit[i];
            const rating = this.props.questionRating[i];
            const answers = this.props.answererList[i];
            const time = this.props.timeArray[i];
            const isOverDue = this.props.isOverDue[i];
            const shareToken = this.props.shareToken[i];
            const timeEnd = moment.unix(parseInt(time[0]) + parseInt(time[2])).format('dddd, Do MMMM YYYY, h:mm:ss a');
            console.log(deposit)
            // if(isOverDue && (shareToken==0)){
            //     this.shareToken(address);
            // }
            return <Table.Row key={i}>
                <Table.Cell textAlign='center' width={2}>
                    <Statistic size='mini' color='red'>
                        <Statistic.Value><span 
                                            style={{fontSize: 15, color: '#6A737C'}}><Rating icon='star' size='huge' 
                                            defaultRating={rating} 
                                            maxRating={5} disabled />
                                        </span></Statistic.Value>
                        <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>votes</span></Statistic.Label>
                    </Statistic>
                </Table.Cell>
                <Table.Cell textAlign='center' width={2}>
                    <Statistic size='mini' color='red'>
                        <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>{answers.length}</span></Statistic.Value>
                        <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>answers</span></Statistic.Label>
                    </Statistic>
                </Table.Cell>
                <Table.Cell textAlign='center' width={2}>
                    <Statistic size='mini' color='red'>
                        <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>{deposit}</span></Statistic.Value>
                        <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>ethers</span></Statistic.Label>
                    </Statistic>
                </Table.Cell>
                <Table.Cell textAlign='left'>
                    <Grid.Row textAlign='left'>
                        <span style={{fontSize: 18, color: '#6A737C', cursor: 'pointer'}} onClick={() => Router.pushRoute(`/rents/${address}`)}><a>{this.props.names[i]}</a></span></Grid.Row>
                    {isOverDue ? 
                    ((shareToken == 0) ? 
                    <Grid.Row textAlign='right'>
                        <Button positive onClick={(e)=>this.shareToken(e, address)}  loading={this.state.loadingShareToken} disabled={this.state.disabledShareToken}>
                                 Share Tokens!
                        </Button>
                        <Message color='red' compact size='mini'
                            header={'End time: '+timeEnd}
                        />
                    </Grid.Row> : <Grid.Row textAlign='right'><span>Tokens Shared! <Icon name='check' color='green'/></span></Grid.Row>) :
                    <Grid.Row textAlign='right'>
                    <Message color='yellow' compact size='mini'
                        header={'End time: '+timeEnd}
                    />
                </Grid.Row>}
                </Table.Cell> 
            </Table.Row>
        });

        return  <Table>
            <Table.Body>
                {items}
            </Table.Body>
        </Table>
    }

    // renderRentsMobile() {
    //     const items = this.props.availableRents.map((address, i) => {
    //         const deposit = ethers.utils.formatUnits(this.props.deposit[i], "ether");
    //         const rating = this.props.ratingCounts[i];
    //         return <Table fixed>
    //         <Table.Body>
    //         <Table.Row>
    //             <Table.Cell textAlign='center' width={2}>
    //                 <Statistic size='mini' color='red'>
    //                     <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>{rating}</span></Statistic.Value>
    //                     <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>votes</span></Statistic.Label>
    //                 </Statistic>
    //             </Table.Cell>
    //             <Table.Cell textAlign='center' width={2}>
    //                 <Statistic size='mini' color='red'>
    //                     <Statistic.Value><span 
    //                                         style={{fontSize: 15, color: '#6A737C'}}><Rating icon='star' size='huge' 
    //                                         defaultRating={this.state.totalRating} 
    //                                         maxRating={5} disabled />
    //                                     </span>
    //                     </Statistic.Value>
    //                     <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>answers</span></Statistic.Label>
    //                 </Statistic>
    //             </Table.Cell>
    //             <Table.Cell textAlign='center' width={2}>
    //                 <Statistic size='mini' color='red'>
    //                     <Statistic.Value><span style={{fontSize: 15, color: '#6A737C'}}>{deposit}</span></Statistic.Value>
    //                     <Statistic.Label><span style={{fontSize: 15, color: '#6A737C'}}>ethers</span></Statistic.Label>
    //                 </Statistic>
    //             </Table.Cell>
    //             <Table.Cell textAlign='left'>
    //                 <Grid.Row textAlign='left'>
    //                     <span style={{fontSize: 18, color: '#6A737C'}}><a>{this.props.names[i]}</a></span></Grid.Row>
    //                 <Grid.Row textAlign='right'>Duration: 2 hours</Grid.Row>
    //             </Table.Cell> 
    //         </Table.Row>
    //         </Table.Body>
    //         </Table>
    //     });

    //     return <Responsive getWidth={getWidthFactory(this.props.isMobileFromSSR)} 
    //                         maxWidth={Responsive.onlyMobile.maxWidth} stackable doubling>
    //                         {items}
    //             </Responsive>;
    // }

    render() {
        const itemsLength = this.props.availableRents? this.props.availableRents.length : 0;

        return(
            <Layout>
                <h3>Questions</h3>
                <Divider hidden/>

                {this.renderRentsDesktop()}
                {/* {this.renderRentsMobile()} */}

                <Divider hidden/>
                <div style={{ marginTop: 20 }}>Found {itemsLength} Item(s).</div>
                <Divider hidden/>
            </Layout>
        );
    }
}

export default RentalIndex;
