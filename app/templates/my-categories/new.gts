import ScreenHeader from 'headband/components/screen-header';
import CategoryForm from 'headband/components/category-form';

<template>
  <ScreenHeader @title="New category" @backTo="my-categories.index" />
  <CategoryForm />
</template>
